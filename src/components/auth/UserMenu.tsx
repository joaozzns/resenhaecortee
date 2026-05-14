"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  Calendar,
  Heart,
  LogOut,
  Settings,
  Star,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserSnapshot = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: "client" | "barber" | "admin";
};

/**
 * Usado no Header. Subscreve onAuthStateChange — atualiza sem flash quando
 * o usuário entra/sai em outra aba.
 */
export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<UserSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function load() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role")
        .eq("id", u.id)
        .maybeSingle();
      if (!mounted) return;
      setUser({
        id: u.id,
        email: u.email ?? null,
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        role: (profile?.role as UserSnapshot["role"]) ?? "client",
      });
      setLoading(false);
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div
        aria-hidden
        className="h-9 w-9 rounded-full bg-surface-2 animate-pulse"
      />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/entrar">Entrar</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/agendar">Agendar</Link>
        </Button>
      </div>
    );
  }

  const firstName = user.fullName?.split(" ")[0] ?? "Cliente";
  const initials =
    user.fullName
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ??
    user.email?.[0]?.toUpperCase() ??
    "C";

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          aria-label="Menu da conta"
          className={cn(
            "flex items-center gap-2.5 px-2 py-1 rounded-full",
            "text-foreground/85 hover:text-foreground",
            "border border-transparent hover:border-border",
            "transition-colors"
          )}
        >
          <Avatar
            url={user.avatarUrl}
            name={user.fullName ?? user.email ?? "Cliente"}
            initials={initials}
          />
          <span className="hidden md:inline text-sm">Olá, {firstName}</span>
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          className={cn(
            "min-w-[260px] rounded-[var(--radius-lg)] z-50",
            "bg-surface border border-border shadow-2xl",
            "p-2 origin-top-right",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="px-3 py-3 border-b border-border mb-2">
            <p className="text-sm font-medium text-foreground truncate">
              {user.fullName ?? "Cliente"}
            </p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>

          <MenuLink href="/minha-conta" icon={UserIcon}>
            Visão geral
          </MenuLink>
          <MenuLink href="/minha-conta/agendamentos" icon={Calendar}>
            Meus agendamentos
          </MenuLink>
          <MenuLink href="/minha-conta/favoritos" icon={Heart}>
            Favoritos
          </MenuLink>
          {process.env.NEXT_PUBLIC_LOYALTY_ENABLED === "true" && (
            <MenuLink href="/minha-conta/fidelidade" icon={Star}>
              Pontos de fidelidade
            </MenuLink>
          )}
          <MenuLink href="/minha-conta/perfil" icon={Settings}>
            Perfil
          </MenuLink>

          {(user.role === "admin" || user.role === "barber") && (
            <>
              <Dropdown.Separator className="my-2 h-px bg-border" />
              <MenuLink href="/admin" icon={Settings}>
                Painel da equipe
              </MenuLink>
            </>
          )}

          <Dropdown.Separator className="my-2 h-px bg-border" />
          <Dropdown.Item
            onSelect={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] cursor-pointer outline-none",
              "text-foreground/80 data-[highlighted]:bg-surface-2 data-[highlighted]:text-foreground"
            )}
          >
            <LogOut className="h-4 w-4 text-muted" aria-hidden />
            Sair
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

function Avatar({
  url,
  name,
  initials,
}: {
  url: string | null;
  name: string;
  initials: string;
}) {
  if (url) {
    return (
      <span className="relative h-8 w-8 rounded-full overflow-hidden border border-border">
        <Image src={url} alt={name} fill sizes="32px" className="object-cover" />
      </span>
    );
  }
  return (
    <span className="grid place-items-center h-8 w-8 rounded-full bg-accent text-background text-xs font-semibold">
      {initials}
    </span>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof UserIcon;
  children: React.ReactNode;
}) {
  return (
    <Dropdown.Item asChild>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] outline-none cursor-pointer",
          "text-foreground/85 data-[highlighted]:bg-surface-2 data-[highlighted]:text-foreground transition-colors"
        )}
      >
        <Icon className="h-4 w-4 text-muted" aria-hidden />
        <span className="text-sm">{children}</span>
      </Link>
    </Dropdown.Item>
  );
}
