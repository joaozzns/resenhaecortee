"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings2,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/minha-conta", label: "Visão geral", Icon: LayoutDashboard },
  { href: "/minha-conta/agendamentos", label: "Agendamentos", Icon: Calendar },
  { href: "/minha-conta/favoritos", label: "Favoritos", Icon: Heart },
  { href: "/minha-conta/perfil", label: "Perfil", Icon: Settings2 },
] as const;

const FIDELIDADE = {
  href: "/minha-conta/fidelidade",
  label: "Fidelidade",
  Icon: Star,
} as const;

export function AccountSidebar({ loyaltyEnabled }: { loyaltyEnabled: boolean }) {
  const pathname = usePathname();
  const items = loyaltyEnabled ? [...ITEMS, FIDELIDADE] : ITEMS;

  return (
    <nav
      aria-label="Conta"
      className="lg:sticky lg:top-28 rounded-[var(--radius-lg)] border border-border bg-surface p-3 lg:p-4"
    >
      <ul className="grid grid-cols-2 lg:grid-cols-1 gap-1">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/minha-conta"
              ? pathname === href
              : pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm",
                  "transition-colors",
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
