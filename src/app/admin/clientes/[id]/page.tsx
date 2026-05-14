import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

export const metadata = { title: "Cliente" };

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const { data: appts } = await admin
    .from("appointments")
    .select(
      "id, starts_at, status, total_cents, barber:barbers(name), appointment_services(services(name))"
    )
    .eq("client_id", id)
    .order("starts_at", { ascending: false })
    .limit(50);

  // Mensalista? — qualquer assinatura ativa do cliente
  const { data: subs } = await admin
    .from("client_subscriptions")
    .select("id, plan_name, price_cents, started_at, status")
    .eq("profile_id", id)
    .eq("status", "active")
    .limit(1);
  const activeSub = subs?.[0] ?? null;

  const totalSpent =
    (appts ?? [])
      .filter((a) => a.status !== "cancelled")
      .reduce((s, x) => s + (x.total_cents ?? 0), 0);
  const visits = (appts ?? []).filter((a) => a.status !== "cancelled").length;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar à lista
      </Link>

      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Cliente
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl md:text-4xl">
            {profile.full_name ?? "—"}
          </h1>
          {activeSub && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] border border-accent/60 bg-accent-soft text-accent">
              Mensalista · {activeSub.plan_name}
            </span>
          )}
        </div>
        <p className="text-foreground/70">
          Telefone {profile.phone ?? "—"} ·{" "}
          {profile.birthdate
            ? `Aniversário ${format(new Date(`${profile.birthdate}T12:00:00`), "dd/MM")}`
            : "Sem aniversário cadastrado"}
        </p>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="py-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Visitas
            </p>
            <p className="font-display text-3xl mt-1">{visits}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Total gasto
            </p>
            <p className="font-display text-3xl mt-1">
              {formatBRL(totalSpent)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Pontos atuais
            </p>
            <p className="font-display text-3xl mt-1 text-accent">
              {profile.loyalty_points}
            </p>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Histórico</h2>
        <Card className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border text-left text-muted">
              <tr>
                <th className="p-3 font-normal">Data</th>
                <th className="p-3 font-normal">Serviços</th>
                <th className="p-3 font-normal">Barbeiro</th>
                <th className="p-3 font-normal">Status</th>
                <th className="p-3 font-normal text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(appts ?? []).map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    {format(new Date(a.starts_at), "dd/MM HH:mm", {
                      locale: ptBR,
                    })}
                  </td>
                  <td className="p-3">
                    {(
                      a.appointment_services as unknown as Array<{
                        services: { name: string } | null;
                      }>
                    )
                      .map((x) => x.services?.name ?? "?")
                      .join(", ")}
                  </td>
                  <td className="p-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(a.barber as any)?.name ?? "—"}
                  </td>
                  <td className="p-3 text-muted text-xs uppercase tracking-[0.15em]">
                    {a.status}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {formatBRL(a.total_cents)}
                  </td>
                </tr>
              ))}
              {(!appts || appts.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">
                    Nenhum agendamento ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
