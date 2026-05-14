import { notFound } from "next/navigation";
import Link from "next/link";
import { Gift, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Fidelidade" };

const REWARDS = [
  { points: 50, label: "Barba grátis" },
  { points: 100, label: "Corte grátis" },
  { points: 200, label: "Combo Corte + Barba" },
] as const;

export default async function FidelidadePage() {
  if (process.env.NEXT_PUBLIC_LOYALTY_ENABLED !== "true") notFound();

  const me = await requireAuth("/minha-conta/fidelidade");
  const points = me.profile?.loyalty_points ?? 0;

  // Histórico de transações (próprias, RLS lt_select_own)
  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("loyalty_transactions")
    .select("id, points, reason, created_at")
    .eq("profile_id", me.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Próxima recompensa
  const nextReward =
    REWARDS.find((r) => r.points > points) ?? REWARDS[REWARDS.length - 1];
  const prevReward = [...REWARDS].reverse().find((r) => r.points <= points);
  const base = prevReward?.points ?? 0;
  const progress = Math.min(
    100,
    Math.round(((points - base) / (nextReward.points - base)) * 100)
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Programa de fidelidade
        </span>
        <h1 className="text-3xl md:text-4xl">Pontos & recompensas</h1>
        <p className="text-foreground/70 max-w-2xl">
          A cada R$ 1 gasto você acumula 1 ponto. Pode trocar pelas
          recompensas abaixo a qualquer momento.
        </p>
      </header>

      <Card>
        <CardBody className="py-8 space-y-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Saldo atual
              </p>
              <p className="font-display text-5xl text-accent">{points}</p>
              <p className="text-xs text-muted">
                pontos acumulados
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Próxima recompensa
              </p>
              <p className="font-display text-2xl">{nextReward.label}</p>
              <p className="text-xs text-accent">
                em {Math.max(0, nextReward.points - points)} pontos
              </p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500 ease-[var(--ease-refined)]"
                style={{ width: `${progress}%` }}
                aria-hidden
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] uppercase tracking-[0.2em] text-muted tabular-nums">
              <span>{base}</span>
              <span>{nextReward.points}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <section className="grid sm:grid-cols-3 gap-4">
        {REWARDS.map((r) => {
          const unlocked = points >= r.points;
          return (
            <Card key={r.points}>
              <CardBody className="py-6 text-center">
                <Gift
                  className={cn(
                    "h-6 w-6 mx-auto",
                    unlocked ? "text-accent" : "text-muted"
                  )}
                  aria-hidden
                />
                <p className="mt-3 font-display text-lg">{r.label}</p>
                <p className="mt-1 text-xs text-muted">
                  {r.points} pontos
                </p>
                {unlocked && (
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href="/contato">Resgatar</Link>
                  </Button>
                )}
              </CardBody>
            </Card>
          );
        })}
      </section>

      {tx && tx.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" aria-hidden />
            Histórico
          </h2>
          <Card>
            <ul className="divide-y divide-border">
              {tx.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                >
                  <div>
                    <p className="text-foreground/85">{t.reason}</p>
                    <p className="text-xs text-muted">
                      {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-display tabular-nums inline-flex items-center gap-1.5",
                      t.points > 0 ? "text-success" : "text-danger"
                    )}
                  >
                    <Star className="h-3.5 w-3.5" aria-hidden />
                    {t.points > 0 ? "+" : ""}
                    {t.points}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
