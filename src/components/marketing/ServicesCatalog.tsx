"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/lib/supabase/types";
import { ServiceCard } from "./ServiceCard";
import { cn } from "@/lib/utils";

type Service = Tables<"services">;

const FILTERS = [
  { id: "todos", label: "Tudo" },
  { id: "cabelo", label: "Cabelo" },
  { id: "barba", label: "Barba" },
  { id: "combo", label: "Combos" },
  { id: "tratamento", label: "Tratamentos" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function ServicesCatalog({ services }: { services: Service[] }) {
  const [filter, setFilter] = useState<FilterId>("todos");

  const visible = useMemo(
    () =>
      filter === "todos"
        ? services
        : services.filter((s) => s.category === filter),
    [services, filter]
  );

  // Conta por categoria — usado para o badge ao lado do label do filtro
  const counts = useMemo(() => {
    const map: Partial<Record<FilterId, number>> = { todos: services.length };
    for (const s of services) {
      map[s.category as FilterId] = (map[s.category as FilterId] ?? 0) + 1;
    }
    return map;
  }, [services]);

  return (
    <div>
      {/* Tabs de filtro */}
      <div className="flex flex-wrap gap-2 mb-10 md:mb-14" role="tablist">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          const count = counts[f.id] ?? 0;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm",
                "border transition-all duration-200 ease-[var(--ease-refined)]",
                active
                  ? "bg-accent text-background border-accent"
                  : "bg-transparent text-foreground/80 border-border hover:border-accent/60 hover:text-foreground"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  active ? "text-background/70" : "text-muted"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
        >
          {visible.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </motion.div>
      </AnimatePresence>

      {visible.length === 0 && (
        <p className="text-muted">
          Nenhum serviço encontrado nessa categoria.
        </p>
      )}
    </div>
  );
}
