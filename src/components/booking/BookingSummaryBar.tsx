"use client";

import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Service } from "@/lib/booking/types";
import { formatBRL, formatDuration } from "@/lib/utils";

/**
 * Barra fixa no rodapé exibindo total dinâmico durante os passos 1-3.
 * Não aparece no passo 4 (resumo já está no formulário).
 */
export function BookingSummaryBar({
  services,
  canAdvance,
  ctaLabel,
  onAdvance,
}: {
  services: Service[];
  canAdvance: boolean;
  ctaLabel: string;
  onAdvance: () => void;
}) {
  const totalCents = services.reduce((s, x) => s + x.price_cents, 0);
  const totalDuration = services.reduce(
    (s, x) => s + x.duration_minutes,
    0
  );
  const count = services.length;

  return (
    <div
      role="region"
      aria-label="Resumo do agendamento"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md"
    >
      <div className="container-x py-4 flex items-center justify-between gap-4">
        <div className="min-w-0 flex items-center gap-5 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Selecionado
            </p>
            <p className="font-medium tabular-nums">
              {count === 0
                ? "—"
                : `${count} serviço${count > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Duração
            </p>
            <p className="font-medium inline-flex items-center gap-1.5 tabular-nums">
              <Clock className="h-3 w-3 text-accent" aria-hidden />
              {totalDuration > 0 ? formatDuration(totalDuration) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Total
            </p>
            <p className="font-display text-xl text-foreground">
              {formatBRL(totalCents)}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="md"
          onClick={onAdvance}
          disabled={!canAdvance}
          className="shrink-0"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
