"use client";

import { useState } from "react";
import { AppointmentCard } from "@/components/account/AppointmentCard";
import type { AppointmentWithDetails } from "@/lib/account/queries";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "upcoming", label: "Próximos" },
  { id: "past", label: "Histórico" },
  { id: "cancelled", label: "Cancelados" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AppointmentTabs({
  upcoming,
  past,
  cancelled,
}: {
  upcoming: AppointmentWithDetails[];
  past: AppointmentWithDetails[];
  cancelled: AppointmentWithDetails[];
}) {
  const [tab, setTab] = useState<TabId>("upcoming");

  const lists: Record<TabId, AppointmentWithDetails[]> = {
    upcoming,
    past,
    cancelled,
  };
  const counts: Record<TabId, number> = {
    upcoming: upcoming.length,
    past: past.length,
    cancelled: cancelled.length,
  };

  const list = lists[tab];

  return (
    <div className="space-y-6">
      <div role="tablist" className="flex items-center gap-1 p-1 bg-surface border border-border rounded-full w-fit">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all",
                active
                  ? "bg-accent text-background"
                  : "text-foreground/75 hover:text-foreground"
              )}
            >
              {t.label}
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  active ? "text-background/70" : "text-muted"
                )}
              >
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="text-muted">Nenhum agendamento nesta lista.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((a) => (
            <AppointmentCard key={a.id} appointment={a} />
          ))}
        </div>
      )}
    </div>
  );
}
