"use client";

import { Check, Clock, Sparkles, Scissors, Zap } from "lucide-react";
import type { Service } from "@/lib/booking/types";
import { cn, formatBRL, formatDuration } from "@/lib/utils";

const ICON_BY_CATEGORY = {
  cabelo: Scissors,
  barba: Zap,
  combo: Sparkles,
  tratamento: Sparkles,
} as const;

const CATEGORY_LABEL = {
  cabelo: "Cabelo",
  barba: "Barba",
  combo: "Combo",
  tratamento: "Tratamento",
} as const;

/**
 * Passo 1 — múltipla seleção. Combos contam como um item só.
 * Selecionar um serviço de combo + adicionais é permitido (a barbearia
 * decide se faz sentido), o total apenas soma duração e preço.
 */
export function ServicePickerStep({
  services,
  selected,
  onToggle,
}: {
  services: Service[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Passo 1
        </span>
        <h2 className="text-3xl md:text-4xl font-display">
          Escolha o que vai fazer hoje.
        </h2>
        <p className="text-foreground/70 text-sm md:text-base leading-relaxed max-w-2xl">
          Pode marcar mais de um — somamos duração e preço automaticamente.
          Combos já incluem múltiplos serviços.
        </p>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {services.map((s) => {
          const Icon = ICON_BY_CATEGORY[s.category] ?? Scissors;
          const checked = selected.includes(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onToggle(s.id)}
                aria-pressed={checked}
                className={cn(
                  "group w-full text-left flex gap-5 p-5 md:p-6 rounded-[var(--radius-lg)]",
                  "border bg-surface transition-all duration-200 ease-[var(--ease-refined)]",
                  checked
                    ? "border-accent bg-accent-soft/40"
                    : "border-border hover:border-accent/50 hover:bg-surface-2"
                )}
              >
                <div className="shrink-0 mt-0.5">
                  <span
                    className={cn(
                      "grid place-items-center h-11 w-11 rounded-full border transition-colors",
                      checked
                        ? "bg-accent text-background border-accent"
                        : "border-border-strong text-accent group-hover:border-accent"
                    )}
                  >
                    {checked ? (
                      <Check className="h-5 w-5" aria-hidden />
                    ) : (
                      <Icon className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted">
                    <span>{CATEGORY_LABEL[s.category]}</span>
                    <span className="h-px w-5 bg-border" />
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" aria-hidden />
                      {formatDuration(s.duration_minutes)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg md:text-xl font-display font-semibold">
                    {s.name}
                  </h3>
                  {s.description && (
                    <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                      {s.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 self-start">
                  <span className="font-display text-xl text-foreground">
                    {formatBRL(s.price_cents)}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
