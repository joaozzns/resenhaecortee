"use client";

import { Check } from "lucide-react";
import { STEPS, type StepId } from "@/lib/booking/types";
import { cn } from "@/lib/utils";

/**
 * Indicador de passos no topo do /agendar.
 * Horizontal no desktop, vertical compacto no mobile.
 */
export function Stepper({
  current,
  reached,
  onJump,
}: {
  current: StepId;
  reached: StepId[];
  onJump: (id: StepId) => void;
}) {
  return (
    <ol className="flex flex-col md:flex-row md:items-center gap-3 md:gap-2">
      {STEPS.map((s, i) => {
        const isActive = s.id === current;
        const isReached = reached.includes(s.id);
        const canJump = isReached && !isActive;
        return (
          <li
            key={s.id}
            className="flex items-center gap-3 md:flex-1 md:min-w-0"
          >
            <button
              type="button"
              onClick={() => canJump && onJump(s.id)}
              disabled={!canJump}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 group",
                "outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm",
                canJump && "cursor-pointer",
                !canJump && !isActive && "cursor-not-allowed opacity-60"
              )}
            >
              <span
                className={cn(
                  "shrink-0 grid place-items-center h-8 w-8 rounded-full border text-xs font-semibold transition-colors",
                  isActive && "bg-accent text-background border-accent",
                  !isActive && isReached && "bg-accent-soft text-accent border-accent",
                  !isActive && !isReached && "border-border text-muted"
                )}
              >
                {isReached && !isActive ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  i + 1
                )}
              </span>
              <span className="flex flex-col items-start text-left min-w-0">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  Passo {i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-foreground" : "text-foreground/70"
                  )}
                >
                  {s.label}
                </span>
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="hidden md:block flex-1 h-px bg-border mx-1"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
