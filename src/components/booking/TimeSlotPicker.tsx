"use client";

import { Clock } from "lucide-react";
import type { Slot } from "@/lib/booking/availability";
import { cn } from "@/lib/utils";

/**
 * Grade de horários — agrupa em manhã/tarde/noite para escaneabilidade.
 * Slots vêm já filtrados pela API (apenas livres).
 */
export function TimeSlotPicker({
  slots,
  selected,
  onSelect,
  loading,
}: {
  slots: Slot[];
  selected: string | null; // "HH:MM"
  onSelect: (s: Slot) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div
        aria-live="polite"
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="h-11 rounded-[var(--radius-sm)] bg-surface-2 animate-pulse"
            aria-hidden
          />
        ))}
        <span className="sr-only">Carregando horários…</span>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center">
        <Clock className="h-6 w-6 text-muted mx-auto" aria-hidden />
        <p className="mt-3 text-sm text-foreground/80">
          Nenhum horário livre nesse dia.
        </p>
        <p className="text-xs text-muted mt-1">
          Tente outra data ou troque o barbeiro.
        </p>
      </div>
    );
  }

  const groups: Record<"Manhã" | "Tarde" | "Noite", Slot[]> = {
    Manhã: [],
    Tarde: [],
    Noite: [],
  };
  for (const s of slots) {
    const h = Number(s.time.slice(0, 2));
    if (h < 12) groups["Manhã"].push(s);
    else if (h < 18) groups["Tarde"].push(s);
    else groups["Noite"].push(s);
  }

  return (
    <div className="space-y-6">
      {(Object.keys(groups) as Array<keyof typeof groups>).map((label) => {
        const list = groups[label];
        if (list.length === 0) return null;
        return (
          <div key={label}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">
              {label}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {list.map((s) => {
                const active = s.time === selected;
                return (
                  <button
                    key={s.startsAtUtc}
                    type="button"
                    onClick={() => onSelect(s)}
                    aria-pressed={active}
                    className={cn(
                      "h-11 rounded-[var(--radius-sm)] text-sm font-medium tabular-nums",
                      "border transition-all duration-200 ease-[var(--ease-refined)]",
                      active
                        ? "bg-accent text-background border-accent"
                        : "bg-transparent text-foreground border-border hover:border-accent hover:text-accent"
                    )}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
