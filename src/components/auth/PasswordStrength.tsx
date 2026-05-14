"use client";

import { useMemo } from "react";
import { passwordStrength } from "@/lib/auth/schemas";
import { cn } from "@/lib/utils";

const COLORS = [
  "bg-border",
  "bg-danger",
  "bg-amber-500",
  "bg-success",
  "bg-accent",
] as const;

/**
 * Indicador visual de 4 barras + rótulo. Não bloqueia o submit — só comunica.
 * Render condicionado: nada aparece com senha vazia.
 */
export function PasswordStrength({ value }: { value: string }) {
  const { score, label } = useMemo(() => passwordStrength(value), [value]);
  if (!value) return null;

  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <ol className="flex-1 grid grid-cols-4 gap-1.5" role="presentation">
        {[1, 2, 3, 4].map((step) => (
          <li
            key={step}
            className={cn(
              "h-1 rounded-full transition-colors duration-200",
              step <= score ? COLORS[score] : "bg-border"
            )}
          />
        ))}
      </ol>
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted min-w-[60px] text-right">
        {label}
      </span>
    </div>
  );
}
