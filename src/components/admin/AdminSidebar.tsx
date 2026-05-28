"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarPlus,
  CalendarRange,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ShieldOff,
  Star,
  UsersRound,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/agendamentos", label: "Agenda", Icon: CalendarRange },
  { href: "/admin/novo-agendamento", label: "Novo agend.", Icon: CalendarPlus },
  { href: "/admin/clientes", label: "Clientes", Icon: UsersRound },
  { href: "/admin/planos", label: "Mensalistas", Icon: CreditCard },
  { href: "/admin/servicos", label: "Serviços", Icon: ListChecks },
  { href: "/admin/barbeiros", label: "Barbeiros", Icon: Wrench },
  { href: "/admin/bloqueios", label: "Bloqueios", Icon: ShieldOff },
] as const;

const FIDELIDADE = {
  href: "/admin/fidelidade",
  label: "Fidelidade",
  Icon: Star,
} as const;

export function AdminSidebar({
  loyaltyEnabled,
}: {
  loyaltyEnabled: boolean;
}) {
  const pathname = usePathname();
  const items = loyaltyEnabled ? [...ITEMS, FIDELIDADE] : ITEMS;

  return (
    <nav
      aria-label="Painel"
      className="lg:sticky lg:top-28 rounded-[var(--radius-lg)] border border-border bg-surface p-3 lg:p-4"
    >
      <header className="flex items-center gap-2 px-3 pb-3 mb-1 border-b border-border lg:border-0 lg:pb-0 lg:mb-0 lg:py-1">
        <UsersRound
          className="h-4 w-4 text-accent shrink-0 lg:hidden"
          aria-hidden
        />
        <p className="font-semibold text-sm lg:text-[10px] uppercase tracking-[0.22em] text-accent">
          Painel da equipe
        </p>
      </header>
      <ul className="mt-2 grid grid-cols-2 lg:grid-cols-1 gap-1">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/admin"
              ? pathname === href
              : pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-foreground/80 hover:text-foreground hover:bg-surface-2"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <hr className="my-3 border-border" />

      <form action="/auth/signout" method="POST">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sair
        </button>
      </form>
    </nav>
  );
}
