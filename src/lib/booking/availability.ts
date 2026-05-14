import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { addMinutes, isBefore, parseISO } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Lógica de disponibilidade da Resenha e Corte.
 *
 * Decisões importantes:
 *  - Trabalhamos em America/Sao_Paulo (UTC-3, Brasil sem DST desde 2019).
 *  - Slots são granularidade de 30 minutos. Toda duration_minutes do
 *    catálogo é múltiplo de 30 (CHECK no DB garante).
 *  - Para um serviço/combo de N min, precisamos de N/30 slots consecutivos
 *    livres a partir do horário escolhido.
 *  - Slot "livre" = dentro de working_hours, sem overlap com time_blocks
 *    nem appointments confirmed/completed.
 *
 * O check final acontece de novo no /api/appointments antes do INSERT,
 * via overlap de timestamptz. Isto aqui é a versão "consulta-rica" para o
 * cliente popular o seletor.
 */

export const TZ = "America/Sao_Paulo";
// Granularidade de 15 min — comporta serviços de 15/45 min sem desperdício.
export const SLOT_MINUTES = 15;
const MIN_LEAD_HOURS = Number(process.env.BOOKING_MIN_LEAD_HOURS ?? 1);
const MAX_LEAD_DAYS = Number(process.env.BOOKING_MAX_LEAD_DAYS ?? 60);

export type Slot = {
  /** "HH:MM" no fuso de São Paulo */
  time: string;
  /** ISO 8601 UTC pronto para gravar em starts_at */
  startsAtUtc: string;
  /** Quando o atendimento termina (exclusivo) — útil para o cliente ver */
  endsAtUtc: string;
  /** No modo "qualquer barbeiro", indica qual barbeiro pode pegar o slot */
  barberId: string;
};

export type AvailabilityRequest = {
  /** "any" para "sem preferência", ou um UUID de barbers.id */
  barberId: string;
  /** "YYYY-MM-DD" no fuso BR */
  date: string;
  /** Soma das durações dos serviços selecionados, em minutos */
  durationMinutes: number;
};

/**
 * Constrói um Date UTC a partir de "YYYY-MM-DD" e "HH:MM" no fuso BR.
 */
function brToUtc(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, TZ);
}

/**
 * Gera slots de 30 em 30 min entre [startTime, endTime) no fuso BR.
 * endTime é exclusivo: 09:00–20:00 → último slot 19:30 não importa qual a
 * duração (ela pode estourar 20h e isso é bloqueado depois).
 */
function genSlots(startTime: string, endTime: string): string[] {
  const out: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  for (let m = startMin; m < endMin; m += SLOT_MINUTES) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(
      `${h.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`
    );
  }
  return out;
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Weekday no fuso BR (0=Dom..6=Sáb), mesma convenção de working_hours.
 */
function weekdayOfBR(date: string): number {
  const utc = fromZonedTime(`${date}T12:00:00`, TZ);
  // "e" é dia da semana local (1..7 com Sun=1 por padrão em date-fns)
  // Mais seguro: usar Date nativo com formatInTimeZone retornando "EEEE"
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const short = formatInTimeZone(utc, TZ, "EEE");
  return map[short] ?? 0;
}

export async function getAvailableSlots({
  barberId,
  date,
  durationMinutes,
}: AvailabilityRequest): Promise<Slot[]> {
  const admin = createAdminClient();

  // Limites de lead time
  const todayUtc = new Date();
  const earliestUtc = addMinutes(todayUtc, MIN_LEAD_HOURS * 60);
  const latestUtc = addMinutes(todayUtc, MAX_LEAD_DAYS * 24 * 60);
  const dayStartUtc = brToUtc(date, "00:00");
  if (dayStartUtc > latestUtc) return [];

  const weekday = weekdayOfBR(date);

  // 1. Resolve barbeiros candidatos
  let barberIds: string[];
  if (barberId === "any") {
    const { data, error } = await admin
      .from("barbers")
      .select("id")
      .eq("active", true);
    if (error) throw error;
    barberIds = data.map((b) => b.id);
  } else {
    barberIds = [barberId];
  }
  if (barberIds.length === 0) return [];

  // 2. working_hours por barbeiro nesse dia
  const { data: hours, error: hoursErr } = await admin
    .from("working_hours")
    .select("barber_id, start_time, end_time")
    .in("barber_id", barberIds)
    .eq("weekday", weekday);
  if (hoursErr) throw hoursErr;

  if (hours.length === 0) return []; // dia fechado

  // 3. time_blocks que tocam o dia (BR), no UTC entre 00:00 e 24:00
  const dayEndUtc = brToUtc(date, "23:59");
  const { data: blocks, error: blocksErr } = await admin
    .from("time_blocks")
    .select("barber_id, starts_at, ends_at")
    .in("barber_id", barberIds)
    .lte("starts_at", dayEndUtc.toISOString())
    .gte("ends_at", dayStartUtc.toISOString());
  if (blocksErr) throw blocksErr;

  // 4. appointments confirmed/completed no mesmo intervalo
  const { data: appts, error: apptsErr } = await admin
    .from("appointments")
    .select("barber_id, starts_at, ends_at, status")
    .in("barber_id", barberIds)
    .lte("starts_at", dayEndUtc.toISOString())
    .gte("ends_at", dayStartUtc.toISOString())
    .neq("status", "cancelled");
  if (apptsErr) throw apptsErr;

  // 5. Para cada barbeiro, gera slots e filtra
  const slotsByTime = new Map<string, Slot>();
  for (const b of barberIds) {
    const myHours = hours.filter((h) => h.barber_id === b);
    const myBlocks = blocks
      .filter((x) => x.barber_id === b)
      .map((x) => ({ start: parseISO(x.starts_at), end: parseISO(x.ends_at) }));
    const myAppts = appts
      .filter((x) => x.barber_id === b)
      .map((x) => ({ start: parseISO(x.starts_at), end: parseISO(x.ends_at) }));

    for (const wh of myHours) {
      // Normaliza time strings: "09:00:00" -> "09:00"
      const startStr = wh.start_time.slice(0, 5);
      const endStr = wh.end_time.slice(0, 5);
      const candidates = genSlots(startStr, endStr);

      for (const t of candidates) {
        const slotStart = brToUtc(date, t);
        const slotEnd = addMinutes(slotStart, durationMinutes);

        // Não pode estourar o expediente
        const expEnd = brToUtc(date, endStr);
        if (slotEnd > expEnd) continue;

        // Respeita lead time
        if (isBefore(slotStart, earliestUtc)) continue;

        // Sem overlap com blocos
        const blocked = myBlocks.some((bl) =>
          overlaps(slotStart, slotEnd, bl.start, bl.end)
        );
        if (blocked) continue;

        // Sem overlap com agendamentos
        const taken = myAppts.some((ap) =>
          overlaps(slotStart, slotEnd, ap.start, ap.end)
        );
        if (taken) continue;

        // Marca o slot — em modo "any", primeiro barbeiro a aceitar leva.
        if (!slotsByTime.has(t)) {
          slotsByTime.set(t, {
            time: t,
            startsAtUtc: slotStart.toISOString(),
            endsAtUtc: slotEnd.toISOString(),
            barberId: b,
          });
        }
      }
    }
  }

  return Array.from(slotsByTime.values()).sort((a, b) =>
    a.time.localeCompare(b.time)
  );
}

/**
 * Re-checa um slot específico antes de gravar. Usa a mesma lógica
 * de overlap consultando o banco. Retorna `{ ok: true, barberId }` ou
 * `{ ok: false, reason }`.
 */
export async function ensureSlotAvailable({
  barberId,
  startsAtUtc,
  endsAtUtc,
}: {
  barberId: string;
  startsAtUtc: string;
  endsAtUtc: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const admin = createAdminClient();
  const start = parseISO(startsAtUtc);
  const end = parseISO(endsAtUtc);

  // Lead time
  const earliest = addMinutes(new Date(), MIN_LEAD_HOURS * 60);
  if (isBefore(start, earliest)) {
    return {
      ok: false,
      reason: `Antecedência mínima de ${MIN_LEAD_HOURS}h não respeitada.`,
    };
  }

  // Overlap com agendamentos (não cancelados)
  const { data: clash, error } = await admin
    .from("appointments")
    .select("id")
    .eq("barber_id", barberId)
    .neq("status", "cancelled")
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString())
    .limit(1);
  if (error) return { ok: false, reason: error.message };
  if (clash.length > 0) {
    return {
      ok: false,
      reason: "Esse horário acabou de ser ocupado. Escolha outro.",
    };
  }

  // Overlap com time_blocks
  const { data: bl, error: blErr } = await admin
    .from("time_blocks")
    .select("id")
    .eq("barber_id", barberId)
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString())
    .limit(1);
  if (blErr) return { ok: false, reason: blErr.message };
  if (bl.length > 0)
    return { ok: false, reason: "Barbeiro indisponível nesse intervalo." };

  return { ok: true };
}
