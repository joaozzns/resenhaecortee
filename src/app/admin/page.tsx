import Link from "next/link";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Hourglass,
  TrendingUp,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AppointmentRow,
  type AdminAppointmentRow,
} from "@/components/admin/AppointmentRow";
import { formatBRL } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

type ApptRaw = {
  id: string;
  starts_at: string;
  status: AdminAppointmentRow["status"];
  client_name: string;
  total_cents: number;
  barber: { name: string } | null;
};

function normalize(rows: ApptRaw[] | null): AdminAppointmentRow[] {
  return (rows ?? []).map((a) => ({
    id: a.id,
    starts_at: a.starts_at,
    status: a.status,
    client_name: a.client_name,
    total_cents: a.total_cents,
    barber_name: a.barber?.name ?? null,
  }));
}

export default async function AdminDashboard() {
  const admin = createAdminClient();
  const now = new Date();
  const dayStart = startOfDay(now).toISOString();
  const dayEnd = endOfDay(now).toISOString();
  const weekEnd = addDays(now, 7).toISOString();

  const [
    { data: todayRaw },
    { data: weekRaw },
    { data: revenueData },
    { data: pendingRaw },
  ] = await Promise.all([
    admin
      .from("appointments")
      .select(
        "id, starts_at, status, client_name, total_cents, barber:barbers(name)"
      )
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd)
      .order("starts_at"),
    admin
      .from("appointments")
      .select("id, total_cents, status")
      .gte("starts_at", dayStart)
      .lte("starts_at", weekEnd)
      .neq("status", "cancelled"),
    admin
      .from("appointments")
      .select("total_cents")
      .gte("starts_at", dayStart)
      .lte("starts_at", weekEnd)
      .neq("status", "cancelled"),
    // Todos os pending dos próximos 60 dias (para a seção de destaque)
    admin
      .from("appointments")
      .select(
        "id, starts_at, status, client_name, total_cents, barber:barbers(name)"
      )
      .eq("status", "pending")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at"),
  ]);

  const today = normalize(todayRaw as ApptRaw[] | null);
  const pending = normalize(pendingRaw as ApptRaw[] | null);
  const todayCount = today.length;
  const weekCount = weekRaw?.length ?? 0;
  const weekRevenueCents =
    revenueData?.reduce((s, x) => s + (x.total_cents ?? 0), 0) ?? 0;
  const completedToday = today.filter((t) => t.status === "completed").length;
  const pendingCount = pending.length;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Hoje
        </span>
        <h1 className="text-3xl md:text-4xl">
          {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h1>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          icon={<Hourglass className="h-5 w-5" />}
          label="Aguardando confirmação"
          value={pendingCount.toString()}
          highlight={pendingCount > 0}
        />
        <Stat
          icon={<CalendarIcon className="h-5 w-5" />}
          label="Agendamentos hoje"
          value={todayCount.toString()}
        />
        <Stat
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Concluídos hoje"
          value={completedToday.toString()}
        />
        <Stat
          icon={<TrendingUp className="h-5 w-5" />}
          label="Próximos 7 dias"
          value={weekCount.toString()}
        />
      </section>

      {/* Seção destacada: pending — só aparece se houver */}
      {pending.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl flex items-center gap-3">
              <span className="grid place-items-center h-8 w-8 rounded-full bg-amber-500/15 text-amber-400">
                <Hourglass className="h-4 w-4" aria-hidden />
              </span>
              Aguardando sua confirmação
            </h2>
            <span className="text-xs text-muted">
              {pending.length} pedido{pending.length > 1 ? "s" : ""}
            </span>
          </div>
          <Card className="border-amber-500/40">
            <ul className="divide-y divide-border">
              {pending.map((a) => (
                <AppointmentRow key={a.id} a={a} />
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">Hoje na casa</h2>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>
              Receita prevista 7d:{" "}
              <strong className="text-foreground">
                {formatBRL(weekRevenueCents)}
              </strong>
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/agendamentos">
                Ver agenda <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        {today.length === 0 ? (
          <Card>
            <CardBody className="py-10 text-center text-muted">
              Sem agendamentos para hoje.
            </CardBody>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {today.map((a) => (
                <AppointmentRow key={a.id} a={a} />
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={
        highlight ? "border-amber-500/50 bg-amber-500/5" : undefined
      }
    >
      <CardBody className="py-6">
        <div className={highlight ? "text-amber-400" : "text-accent"}>
          {icon}
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
          {label}
        </p>
        <p className="mt-1 font-display text-3xl text-foreground">{value}</p>
      </CardBody>
    </Card>
  );
}
