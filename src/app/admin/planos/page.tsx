import { createAdminClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { SubscriptionsAdmin } from "./SubscriptionsAdmin";

export const metadata = { title: "Mensalistas (admin)" };
export const dynamic = "force-dynamic";

export default async function AdminPlanosPage() {
  const admin = createAdminClient();

  const [{ data: subs }, { data: clients }, { data: payments }] =
    await Promise.all([
      admin
        .from("client_subscriptions")
        .select(
          "id, profile_id, plan_name, price_cents, started_at, status, notes, created_at, updated_at, profile:profiles(full_name, phone)"
        )
        .order("status", { ascending: true })
        .order("started_at", { ascending: false }),
      admin
        .from("profiles")
        .select("id, full_name, phone")
        .eq("role", "client")
        .order("full_name", { ascending: true })
        .limit(1000),
      admin
        .from("subscription_payments")
        .select("*")
        .order("paid_at", { ascending: false }),
    ]);

  // Indexa pagamentos por subscription_id para passar pronto pro client.
  const paymentsBySubId: Record<string, Tables<"subscription_payments">[]> = {};
  for (const p of payments ?? []) {
    (paymentsBySubId[p.subscription_id] ??= []).push(p);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Mensalistas
        </span>
        <h1 className="text-3xl md:text-4xl">Clientes com plano mensal</h1>
        <p className="text-foreground/70 max-w-2xl">
          Cadastre clientes que pagam um valor recorrente. Acompanhe receita
          fixa, status (ativo / pausado / cancelado) e desde quando cada um
          virou mensalista. Clique no ícone de recibo em cada linha para
          registrar e ver pagamentos.
        </p>
      </header>

      <SubscriptionsAdmin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subscriptions={(subs ?? []) as any}
        clients={
          clients?.map((c) => ({
            id: c.id,
            full_name: c.full_name,
            phone: c.phone,
          })) ?? []
        }
        paymentsBySubId={paymentsBySubId}
      />
    </div>
  );
}
