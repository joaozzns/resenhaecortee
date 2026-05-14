import { addDays, format, startOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createAdminClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

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
      "id, starts_at, ends_at, status, client_name, total_cents, barber:barbers(name)"
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
                  const cellStart = new Date(`${format(d, "yyyy-MM-dd")}T${h}:00`);
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
    </div>
  );
}
