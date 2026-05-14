/**
 * Smoke test ponta-a-ponta do sistema de agendamento.
 *  1. Lista serviços e barbeiros
 *  2. Pede /api/availability para o próximo dia útil (sex, qua, etc.)
 *  3. POST /api/appointments com o primeiro slot disponível
 *  4. Verifica que o appointment + appointment_services existem no banco
 *  5. Re-tenta o mesmo slot — deve receber 409 (anti double-booking)
 *  6. Limpa
 */

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { addDays, format } from "date-fns";

loadEnv({ path: ".env.local" });

const BASE = "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // 1. catálogo
  const { data: services } = await admin
    .from("services")
    .select("id, name, duration_minutes, price_cents")
    .eq("active", true)
    .order("sort_order")
    .limit(2);
  if (!services || services.length === 0) throw new Error("sem serviços");
  const { data: barbers } = await admin
    .from("barbers")
    .select("id, name")
    .eq("active", true)
    .order("sort_order");
  if (!barbers || barbers.length === 0) throw new Error("sem barbeiros");

  const svc = services[0];
  const barber = barbers[0];
  console.log(`→ Serviço: ${svc.name} (${svc.duration_minutes} min)`);
  console.log(`→ Barbeiro: ${barber.name}`);

  // 2. Achar um dia em que a barbearia está aberta (Ter–Sáb).
  let date = "";
  for (let i = 1; i <= 14; i++) {
    const d = addDays(new Date(), i);
    const dow = d.getDay(); // 0=Dom, 6=Sáb. Ter(2)..Sáb(6)
    if (dow >= 2 && dow <= 6) {
      date = format(d, "yyyy-MM-dd");
      break;
    }
  }
  console.log(`→ Data alvo: ${date}`);

  const availUrl = `${BASE}/api/availability?barberId=${barber.id}&date=${date}&durationMinutes=${svc.duration_minutes}`;
  const availRes = await fetch(availUrl);
  if (!availRes.ok) throw new Error(`availability HTTP ${availRes.status}`);
  const { slots } = (await availRes.json()) as {
    slots: { time: string; startsAtUtc: string; endsAtUtc: string; barberId: string }[];
  };
  if (slots.length === 0) throw new Error("nenhum slot retornado");
  console.log(`→ ${slots.length} slots livres no dia, primeiro = ${slots[0].time}`);

  const slot = slots[0];

  // 3. POST /api/appointments
  const ts = Date.now();
  const body = {
    serviceIds: [svc.id],
    barberId: barber.id,
    startsAtUtc: slot.startsAtUtc,
    client: {
      name: "Smoke Test",
      email: `smoke+${ts}@resenhaecorte.test`,
      phone: "(31) 9 9999-0000",
    },
    notes: "auto",
    acceptTerms: true,
  };
  const createRes = await fetch(`${BASE}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.ok) {
    throw new Error(
      `create falhou HTTP ${createRes.status}: ${JSON.stringify(createJson)}`
    );
  }
  const apptId = createJson.appointment.id;
  console.log(`✓ agendamento ${apptId.slice(0, 8)} criado`);

  // 4. Validar no banco (appointment + link)
  const { data: appt } = await admin
    .from("appointments")
    .select("id, status, total_cents")
    .eq("id", apptId)
    .single();
  const { data: links } = await admin
    .from("appointment_services")
    .select("service_id")
    .eq("appointment_id", apptId);
  console.log(`  ✓ status=${appt?.status} total_cents=${appt?.total_cents}`);
  console.log(`  ✓ ${links?.length} serviço(s) vinculado(s)`);
  if (appt?.total_cents !== svc.price_cents)
    throw new Error("total_cents não bate");

  // 5. Re-tentar mesmo slot → 409
  const retryRes = await fetch(`${BASE}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      client: { ...body.client, email: `dup+${ts}@resenhaecorte.test` },
    }),
  });
  const retryJson = await retryRes.json();
  console.log(
    `→ retry mesmo slot → HTTP ${retryRes.status}  (esperado 409): ${retryJson.error ?? "?"}`
  );
  if (retryRes.status !== 409) {
    throw new Error("anti double-booking falhou: deveria ser 409");
  }
  console.log("  ✓ anti double-booking funcionando");

  // 6. Limpa
  await admin.from("appointment_services").delete().eq("appointment_id", apptId);
  await admin.from("appointments").delete().eq("id", apptId);
  console.log("\n✓ Booking flow OK ponta a ponta.");
}

main().catch((e) => {
  console.error("\n✗ falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
