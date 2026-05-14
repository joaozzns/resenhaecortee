import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Fidelidade (admin)" };

export default async function AdminLoyaltyPage() {
  if (process.env.NEXT_PUBLIC_LOYALTY_ENABLED !== "true") notFound();

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("loyalty_transactions")
    .select("id, points, reason, created_at, profile:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Fidelidade
        </span>
        <h1 className="text-3xl md:text-4xl">Movimentações de pontos</h1>
        <p className="text-foreground/70 max-w-2xl">
          Histórico das últimas 100 transações. Para creditar ou debitar
          manualmente, use o SQL Editor (próxima iteração trará UI).
        </p>
      </header>

      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border text-left text-muted">
            <tr>
              <th className="p-3 font-normal">Data</th>
              <th className="p-3 font-normal">Cliente</th>
              <th className="p-3 font-normal">Motivo</th>
              <th className="p-3 font-normal text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {(tx ?? []).map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="p-3 tabular-nums">
                  {format(new Date(t.created_at), "dd/MM/yyyy")}
                </td>
                <td className="p-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(t.profile as any)?.full_name ?? "—"}
                </td>
                <td className="p-3">{t.reason}</td>
                <td
                  className={
                    "p-3 text-right tabular-nums " +
                    (t.points > 0 ? "text-success" : "text-danger")
                  }
                >
                  {t.points > 0 ? "+" : ""}
                  {t.points}
                </td>
              </tr>
            ))}
            {(!tx || tx.length === 0) && (
              <tr>
                <td className="p-6 text-center text-muted" colSpan={4}>
                  Nenhuma movimentação registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-muted">
        <Link href="/admin" className="hover:text-accent">
          ← Voltar ao dashboard
        </Link>
      </p>
    </div>
  );
}
