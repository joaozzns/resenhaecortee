"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Heart, HeartOff, UsersRound } from "lucide-react";
import { toast } from "sonner";
import {
  setFavoriteBarber,
  toggleFavoriteService,
} from "@/app/minha-conta/actions";
import type { Tables } from "@/lib/supabase/types";
import { cn, formatBRL } from "@/lib/utils";

type Barber = Tables<"barbers">;
type Service = Tables<"services">;

export function FavoritesUI({
  barbers,
  services,
  favoriteBarberId,
  favoriteServiceIds,
}: {
  barbers: Barber[];
  services: Service[];
  favoriteBarberId: string | null;
  favoriteServiceIds: string[];
}) {
  const [favBarber, setFavBarber] = useState<string | null>(favoriteBarberId);
  const [favServices, setFavServices] = useState<Set<string>>(
    new Set(favoriteServiceIds)
  );
  const [pending, startTransition] = useTransition();

  function pickBarber(id: string) {
    const next = favBarber === id ? null : id;
    setFavBarber(next);
    startTransition(async () => {
      const r = await setFavoriteBarber(next);
      if (!r.ok) {
        toast.error("Falha", { description: r.error });
        setFavBarber(favBarber);
      }
    });
  }

  function toggleService(id: string) {
    const next = new Set(favServices);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavServices(next);
    startTransition(async () => {
      const r = await toggleFavoriteService(id);
      if (!r.ok) {
        toast.error("Falha", { description: r.error });
      }
    });
  }

  return (
    <div className="space-y-12">
      {/* Barbeiro favorito */}
      <section className="space-y-5">
        <header className="space-y-1">
          <h2 className="font-display text-2xl">Barbeiro favorito</h2>
          <p className="text-sm text-muted">
            Quando marcado, ele virá pré-selecionado em novos agendamentos.
          </p>
        </header>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map((b) => {
            const active = favBarber === b.id;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => pickBarber(b.id)}
                  disabled={pending}
                  aria-pressed={active}
                  className={cn(
                    "w-full text-left p-4 flex items-center gap-4 rounded-[var(--radius-lg)] border transition-all",
                    active
                      ? "border-accent bg-accent-soft/40"
                      : "border-border bg-surface hover:border-accent/50"
                  )}
                >
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border border-border bg-surface-2 shrink-0">
                    {b.photo_url ? (
                      <Image
                        src={b.photo_url}
                        alt={b.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-accent">
                        <UsersRound className="h-5 w-5" aria-hidden />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{b.name}</p>
                    {b.specialties.length > 0 && (
                      <p className="text-xs text-muted truncate">
                        {b.specialties.slice(0, 2).join(" · ")}
                      </p>
                    )}
                  </div>
                  {active ? (
                    <Heart
                      className="h-5 w-5 fill-accent text-accent"
                      aria-hidden
                    />
                  ) : (
                    <HeartOff
                      className="h-5 w-5 text-muted"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Serviços favoritos */}
      <section className="space-y-5">
        <header className="space-y-1">
          <h2 className="font-display text-2xl">Serviços favoritos</h2>
          <p className="text-sm text-muted">
            Marque os que você costuma fazer — atalho 1-clique nas próximas
            visitas.
          </p>
        </header>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((s) => {
            const fav = favServices.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => toggleService(s.id)}
                  disabled={pending}
                  aria-pressed={fav}
                  className={cn(
                    "w-full text-left p-4 flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border transition-all",
                    fav
                      ? "border-accent bg-accent-soft/40"
                      : "border-border bg-surface hover:border-accent/50"
                  )}
                >
                  <div>
                    <p className="font-display text-base">{s.name}</p>
                    <p className="text-xs text-muted">
                      {s.duration_minutes} min · {formatBRL(s.price_cents)}
                    </p>
                  </div>
                  {fav ? (
                    <Heart
                      className="h-5 w-5 fill-accent text-accent shrink-0"
                      aria-hidden
                    />
                  ) : (
                    <Heart
                      className="h-5 w-5 text-muted shrink-0"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
