import Link from "next/link";
import { ArrowUpRight, Clock, Scissors, Sparkles, Zap } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";
import { formatBRL, formatDuration, cn } from "@/lib/utils";

type Service = Tables<"services">;

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
 * ServiceCard — usado na Home e na página /servicos.
 *
 * Microinteração: borda acende em dourado no hover; o ícone faz translate
 * sutil para a direita; o "Agendar" cresce no underline.
 *
 * featured = destaque visual maior (usado pelo combo na Home).
 */
export function ServiceCard({
  service,
  featured = false,
}: {
  service: Service;
  featured?: boolean;
}) {
  const Icon = ICON_BY_CATEGORY[service.category] ?? Scissors;

  return (
    <Link
      href={`/agendar?service=${service.id}`}
      className={cn(
        "group relative flex flex-col gap-6 p-7 md:p-8",
        "bg-surface border border-border rounded-[var(--radius-lg)]",
        "transition-all duration-300 ease-[var(--ease-refined)]",
        "hover:border-accent/60 hover:bg-surface-2 hover:-translate-y-0.5",
        featured && "lg:col-span-2 lg:flex-row lg:items-center lg:gap-10"
      )}
    >
      <div
        className={cn(
          "shrink-0 grid place-items-center h-12 w-12 rounded-full",
          "border border-border-strong text-accent transition-colors",
          "group-hover:border-accent group-hover:bg-accent-soft"
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.24em] text-muted">
            {CATEGORY_LABEL[service.category]}
          </span>
          <span className="h-px w-6 bg-border" />
          <span className="text-xs text-muted inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3" aria-hidden />
            {formatDuration(service.duration_minutes)}
          </span>
        </div>

        <h3 className="mt-3 text-xl md:text-2xl font-display font-semibold text-foreground">
          {service.name}
        </h3>

        {service.description && (
          <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">
            {service.description}
          </p>
        )}
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-6",
          featured ? "lg:flex-col lg:items-end lg:justify-end" : ""
        )}
      >
        <span className="font-display text-2xl md:text-3xl text-foreground">
          {formatBRL(service.price_cents)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-accent transition-transform duration-300 group-hover:translate-x-1">
          Agendar
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
