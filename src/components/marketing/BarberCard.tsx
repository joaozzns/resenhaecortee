"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { InstagramIcon } from "./social-icons";

type Barber = Tables<"barbers">;

/**
 * BarberCard — foto em B&W por padrão, ganha cor no hover.
 * Especialidades aparecem como pequenas tags.
 */
export function BarberCard({ barber }: { barber: Barber }) {
  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface-2">
        {barber.photo_url ? (
          <Image
            src={barber.photo_url}
            alt={barber.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              "object-cover transition-transform duration-700 ease-[var(--ease-refined)]",
              "group-hover:scale-[1.04]"
            )}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted">
            sem foto
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/30 to-transparent"
        />
        {barber.instagram && (
          <a
            href={barber.instagram}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute top-4 right-4 grid place-items-center h-9 w-9 rounded-full bg-background/70 text-foreground border border-border hover:bg-accent hover:text-background hover:border-accent transition-colors"
            aria-label={`Instagram de ${barber.name}`}
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          <h3 className="font-display text-xl md:text-2xl text-foreground">
            {barber.name}
          </h3>
          {barber.specialties.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {barber.specialties.slice(0, 3).map((spec) => (
                <li
                  key={spec}
                  className="text-[10px] uppercase tracking-[0.18em] text-muted px-2 py-1 border border-border rounded-sm bg-background/60 backdrop-blur-sm"
                >
                  {spec}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Link
        href={`/agendar?barber=${barber.id}`}
        className="mt-5 inline-flex items-center gap-2 text-sm text-accent hover:gap-3 transition-all duration-300"
      >
        Agendar com {barber.name.split(" ")[0]}
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}
