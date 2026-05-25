import { addDays, format, startOfWeek, eachDayOfInterval } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { createAdminClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { fmtBRT, BRT_TZ } from "@/lib/date";

export const metadata = { title: "Agenda" };

const HOURS = [
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
  const { data: appts } = await admin
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, client_name, total_cents, barber:barbers(name), services:appointment_services(service:services(name, price_cents))"
    )
    .gte("starts_at", startMonday.toISOString())
    .lt("starts_at", addDays(startMonday, 7).toISOString())
    .neq("status", "cancelled")
    .order("starts_at");

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
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-muted font-normal w-16">
                Hora
              </th>
              {days.map((d) => {
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <th
                    key={d.toISOString()}
                    className={
                      "text-left p-3 font-normal " +
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
            {HOURS.map((h) => (
              <tr key={h} className="border-b border-border last:border-0">
                <td className="p-3 text-muted tabular-nums align-top">{h}</td>
                {days.map((d) => {
                  // Constrói o instante UTC equivalente a (data+hora) em BRT —
                  // assim a célula bate com a.starts_at independente do TZ do runtime.
                  const cellStart = fromZonedTime(
                    `${format(d, "yyyy-MM-dd")}T${h}:00`,
                    BRT_TZ
                  );
                  const cellEnd = new Date(cellStart.getTime() + 60 * 60 * 1000);
                  const items = (appts ?? []).filter((a) => {
                    const s = new Date(a.starts_at);
                    return s >= cellStart && s < cellEnd;
                  });
                  return (
                    <td key={d.toISOString() + h} className="p-1 align-top">
                      <div className="space-y-1">
                        {items.map((it) => (
                          <div
                            key={it.id}
                            className="rounded bg-accent-soft border border-accent/40 p-2 text-foreground"
                          >
                            <p className="font-medium truncate">
                              {it.client_name}
                            </p>
                            <p className="text-[10px] text-muted truncate">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {(it.barber as any)?.name ?? "—"} ·{" "}
                              {formatBRL(it.total_cents)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

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
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                        Total
                      </p>
                      <p className="font-display text-xl text-foreground tabular-nums">
                        {formatBRL(a.total_cents)}
                      </p>
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
