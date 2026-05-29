import { addDays, format, startOfWeek, eachDayOfInterval } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";
import { fmtBRT, BRT_TZ } from "@/lib/date";
import { buildAppointmentConfirmLink } from "@/lib/whatsapp";

export const metadata = { title: "Agenda" };

const HOURS_FALLBACK = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const STATUS_STYLE = {
  pending: {
    border: "border-amber-400/80",
    dot: "bg-amber-400",
    timeText: "text-amber-400",
  },
  confirmed: {
    border: "border-success/80",
    dot: "bg-success",
    timeText: "text-success",
  },
  completed: {
    border: "border-accent/80",
    dot: "bg-accent",
    timeText: "text-accent",
  },
  no_show: {
    border: "border-muted/60",
    dot: "bg-muted",
    timeText: "text-muted",
  },
  cancelled: {
    border: "border-danger/80",
    dot: "bg-danger",
    timeText: "text-danger",
  },
} as const;

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />
      {label}
    </span>
  );
}

/**
 * Lê as faixas de working_hours e devolve um array "HH:00" cobrindo o
 * primeiro horário aberto até o último horário fechado da semana.
 * Caiu no fallback se a tabela estiver vazia.
 */
function buildHourRange(
  rows: { start_time: string; end_time: string }[] | null,
  fallback: string[]
): string[] {
  if (!rows || rows.length === 0) return fallback;
  let minH = 24;
  let maxH = 0;
  for (const r of rows) {
    const sh = parseInt(r.start_time.slice(0, 2), 10);
    const em = r.end_time.slice(3, 5);
    let eh = parseInt(r.end_time.slice(0, 2), 10);
    // Se o fim não cair no minuto 00, arredonda pra cima
    if (em !== "00") eh += 1;
    if (sh < minH) minH = sh;
    if (eh > maxH) maxH = eh;
  }
  if (minH >= maxH) return fallback;
  const out: string[] = [];
  for (let h = minH; h < maxH; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
  }
  return out;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const sp = await searchParams;
  const today = new Date();
  const startMonday = sp.start
    ? new Date(`${sp.start}T00:00:00`)
    : startOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({
    start: startMonday,
    end: addDays(startMonday, 6),
  });

  const admin = createAdminClient();
  const [{ data: appts }, { data: hours }] = await Promise.all([
    admin
      .from("appointments")
      .select(
        "id, starts_at, ends_at, status, client_name, client_phone, total_cents, barber:barbers(name), services:appointment_services(service:services(name, price_cents))"
      )
      .gte("starts_at", startMonday.toISOString())
      .lt("starts_at", addDays(startMonday, 7).toISOString())
      .neq("status", "cancelled")
      .order("starts_at"),
    admin.from("working_hours").select("start_time, end_time"),
  ]);

  // Calcula o range global da semana a partir do working_hours (envelope que
  // cobre todos os dias). Se vazio, usa o fallback. Sempre múltiplo de 1h —
  // arredonda pra baixo no start e pra cima no end.
  const HOURS = buildHourRange(hours, HOURS_FALLBACK);

  const prev = format(addDays(startMonday, -7), "yyyy-MM-dd");
  const next = format(addDays(startMonday, 7), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="eyebrow flex items-center gap-3">
            <span className="gold-rule" /> Agenda da semana
          </span>
          <h1 className="text-3xl md:text-4xl">
            {format(startMonday, "dd 'de' MMM", { locale: ptBR })} —{" "}
            {format(days[6], "dd 'de' MMM", { locale: ptBR })}
          </h1>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <a
            href={`?start=${prev}`}
            className="px-3 py-1.5 border border-border rounded-full hover:border-accent hover:text-accent transition-colors"
          >
            ← Anterior
          </a>
          <a
            href="/admin/agendamentos"
            className="px-3 py-1.5 border border-border rounded-full hover:border-accent hover:text-accent transition-colors"
          >
            Hoje
          </a>
          <a
            href={`?start=${next}`}
            className="px-3 py-1.5 border border-border rounded-full hover:border-accent hover:text-accent transition-colors"
          >
            Próxima →
          </a>
        </nav>
      </header>

      <Card className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-xs border-separate border-spacing-0">
          <thead className="bg-surface-2/40">
            <tr>
              <th className="sticky left-0 bg-surface-2/80 backdrop-blur z-10 text-left p-3 text-muted font-normal w-16 border-b border-border">
                Hora
              </th>
              {days.map((d) => {
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <th
                    key={d.toISOString()}
                    className={
                      "text-left p-3 font-normal border-b border-border " +
                      (isToday ? "text-accent" : "text-muted")
                    }
                  >
                    {format(d, "EEE", { locale: ptBR })}
                    <br />
                    <span className="text-foreground font-medium">
                      {format(d, "dd/MM")}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h, hIdx) => (
              <tr key={h}>
                <td
                  className={
                    "sticky left-0 bg-background z-10 px-3 py-3 text-muted tabular-nums align-top font-display text-sm" +
                    (hIdx < HOURS.length - 1 ? " border-b border-border" : "")
                  }
                >
                  {h}
                </td>
                {days.map((d) => {
                  // Constrói o instante UTC equivalente a (data+hora) em BRT —
                  // assim a célula bate com a.starts_at independente do TZ do runtime.
                  const cellStart = fromZonedTime(
                    `${format(d, "yyyy-MM-dd")}T${h}:00`,
                    BRT_TZ
                  );
                  const cellEnd = new Date(cellStart.getTime() + 60 * 60 * 1000);
                  const items = (appts ?? [])
                    .filter((a) => {
                      const s = new Date(a.starts_at);
                      return s >= cellStart && s < cellEnd;
                    })
                    .sort(
                      (a, b) =>
                        new Date(a.starts_at).getTime() -
                        new Date(b.starts_at).getTime()
                    );
                  return (
                    <td
                      key={d.toISOString() + h}
                      className={
                        "p-1.5 align-top min-w-[140px]" +
                        (hIdx < HOURS.length - 1 ? " border-b border-border" : "")
                      }
                    >
                      <div className="space-y-1.5">
                        {items.map((it) => {
                          const cfg = STATUS_STYLE[it.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.confirmed;
                          return (
                            <div
                              key={it.id}
                              title={`${fmtBRT(it.starts_at, "HH:mm")} · ${it.client_name} · ${formatBRL(it.total_cents)}`}
                              className={
                                "group rounded-md border-l-2 p-2 bg-surface text-foreground transition-colors hover:bg-surface-2 " +
                                cfg.border
                              }
                            >
                              <div className="flex items-baseline justify-between gap-1.5 mb-0.5">
                                <span
                                  className={
                                    "font-display text-sm tabular-nums leading-none " +
                                    cfg.timeText
                                  }
                                >
                                  {fmtBRT(it.starts_at, "HH:mm")}
                                </span>
                                <span
                                  aria-hidden
                                  className={
                                    "inline-block h-1.5 w-1.5 rounded-full " +
                                    cfg.dot
                                  }
                                />
                              </div>
                              <p className="font-medium text-[11px] leading-tight truncate">
                                {it.client_name}
                              </p>
                              <p className="text-[10px] text-muted tabular-nums leading-tight mt-0.5">
                                {formatBRL(it.total_cents)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Legenda de cores */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted">
        <LegendDot color="bg-amber-400" label="Aguardando" />
        <LegendDot color="bg-success" label="Confirmado" />
        <LegendDot color="bg-accent" label="Concluído" />
        <LegendDot color="bg-muted" label="Faltou" />
      </div>

      <p className="text-xs text-muted">
        Cada bloco corresponde a 1 hora. Cliques e edição inline virão em
        próxima iteração — use a página de bloqueios para folgas.
      </p>

      <section className="space-y-4 pt-4">
        <header className="space-y-2">
          <span className="eyebrow flex items-center gap-3">
            <span className="gold-rule" /> Lista da semana
          </span>
          <h2 className="font-display text-2xl">
            {(appts ?? []).length} agendamento
            {(appts ?? []).length === 1 ? "" : "s"}
          </h2>
        </header>

        {(appts ?? []).length === 0 ? (
          <Card>
            <p className="p-6 text-center text-muted text-sm">
              Sem agendamentos nessa semana.
            </p>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {(appts ?? []).map((a) => {
                /* eslint-disable @typescript-eslint/no-explicit-any */
                const ax = a as any;
                const barberName = ax.barber?.name ?? "—";
                const items = ((ax.services as any[]) ?? [])
                  .map((s) => s.service)
                  .filter(Boolean) as { name: string; price_cents: number }[];
                /* eslint-enable @typescript-eslint/no-explicit-any */
                const isFuture = new Date(a.starts_at) > new Date();
                const wa =
                  a.status === "confirmed" && isFuture
                    ? buildAppointmentConfirmLink({
                        client_name: a.client_name,
                        client_phone: a.client_phone,
                        starts_at: a.starts_at,
                        barber_name: barberName === "—" ? null : barberName,
                      })
                    : null;
                return (
                  <li
                    key={a.id}
                    className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 px-5 py-4 text-sm"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium text-foreground">
                        {a.client_name}
                        <span className="text-muted font-normal">
                          {" "}
                          · com {barberName}
                        </span>
                      </p>
                      <p className="text-xs text-muted tabular-nums">
                        {fmtBRT(a.starts_at, "EEEE, dd/MM 'às' HH:mm")} (BRT)
                      </p>
                      {items.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5 pt-1">
                          {items.map((s, i) => (
                            <li
                              key={`${a.id}-${i}`}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border bg-surface-2 text-[11px] text-foreground/85"
                            >
                              <span>{s.name}</span>
                              <span className="text-muted tabular-nums">
                                {formatBRL(s.price_cents)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex md:flex-col items-end md:items-end justify-between gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                          Total
                        </p>
                        <p className="font-display text-xl text-foreground tabular-nums">
                          {formatBRL(a.total_cents)}
                        </p>
                      </div>
                      {wa && (
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`Avisar ${a.client_name} no WhatsApp`}
                          >
                            <MessageCircle className="h-3 w-3" aria-hidden />
                            WhatsApp
                          </a>
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
