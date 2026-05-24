"use client";

import Image from "next/image";
import { Check, UsersRound } from "lucide-react";
import type { Barber } from "@/lib/booking/types";
import { cn } from "@/lib/utils";

/**
 * Passo 2 — escolher barbeiro ou "sem preferência".
 * "Sem preferência" sempre aparece primeiro como opção em destaque.
 */
export function BarberPickerStep({
  barbers,
  selected,
  onSelect,
}: {
  barbers: Barber[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Passo 2
        </span>
        <h2 className="text-3xl md:text-4xl font-display">
          Com quem você quer fazer?
        </h2>
        <p className="text-foreground/70 text-sm md:text-base leading-relaxed max-w-2xl">
          Escolha o profissional ou deixe a gente encaixar com quem estiver
          disponível primeiro.
        </p>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        <li>
          <BarberOption
            id="any"
            name="Sem preferência"
            subtitle="Encaixamos com o primeiro disponível"
            checked={selected === "any"}
            onSelect={onSelect}
            iconFallback
          />
        </li>
        {barbers.map((b) => (
          <li key={b.id}>
            <BarberOption
              id={b.id}
              name={b.name}
              subtitle={b.specialties.slice(0, 2).join(" · ") || undefined}
              photoUrl={b.photo_url}
              checked={selected === b.id}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarberOption({
  id,
  name,
  subtitle,
  photoUrl,
  checked,
  onSelect,
  iconFallback = false,
}: {
  id: string;
  name: string;
  subtitle?: string;
  photoUrl?: string | null;
  checked: boolean;
  onSelect: (id: string) => void;
  iconFallback?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={checked}
      className={cn(
        "group w-full text-left p-4 sm:p-5 md:p-6 rounded-[var(--radius-lg)] border bg-surface",
        "transition-all duration-200 ease-[var(--ease-refined)] flex items-center gap-4 sm:gap-5",
        checked
          ? "border-accent bg-accent-soft/40"
          : "border-border hover:border-accent/50 hover:bg-surface-2"
      )}
    >
      <div className="relative shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden border border-border bg-surface-2">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            fill
            sizes="64px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-accent">
            <UsersRound className="h-6 w-6" aria-hidden />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-lg leading-tight">{name}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted line-clamp-1">{subtitle}</p>
        )}
      </div>
      {checked && (
        <span
          aria-hidden
          className="grid place-items-center h-7 w-7 rounded-full bg-accent text-background"
        >
          <Check className="h-4 w-4" />
        </span>
      )}
      {iconFallback && !checked && (
        <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-accent shrink-0">
          Recomendado
        </span>
      )}
    </button>
  );
}
