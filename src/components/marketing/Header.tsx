"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import { createClient } from "@/lib/supabase/client";
import { siteConfig, navLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Header sticky.
 *  - Translúcido sobre o hero (saturate + blur), sólido após scroll
 *  - Mobile abre drawer fullscreen com transição staggered dos links
 *  - UserMenu placeholder (botões Entrar / Cadastrar) — vira dropdown na Fase 4
 */
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // null = ainda carregando; evita mostrar "Entrar" a quem já está logado.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Estado de autenticação — mantém o drawer mobile em sincronia com o login.
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setLoggedIn(!!user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Trava scroll do body quando o drawer está aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fecha o drawer ao navegar — sincronização legítima com a URL,
  // não derivação de estado.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300 ease-[var(--ease-refined)]",
          scrolled
            ? "bg-background/85 backdrop-blur-md border-b border-border"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="container-x flex items-center justify-between h-16 md:h-20">
          <Link
            href="/"
            className="flex items-center group"
            aria-label="Resenha e Corte — início"
          >
            <Image
              src="/logor.png"
              alt="Barbearia Resenha"
              width={200}
              height={200}
              priority
              className="h-12 md:h-14 w-auto"
            />
          </Link>

          <nav
            aria-label="Principal"
            className="hidden lg:flex items-center gap-8"
          >
            {navLinks.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative text-sm font-medium tracking-wide transition-colors",
                    "after:absolute after:left-0 after:-bottom-1 after:h-px after:bg-accent after:transition-all after:duration-300",
                    active
                      ? "text-foreground after:w-full"
                      : "text-foreground/70 hover:text-foreground after:w-0 hover:after:w-full"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <UserMenu />
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="lg:hidden grid place-items-center h-10 w-10 -mr-2 text-foreground"
            aria-label="Abrir menu"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      {/* spacer para evitar que o conteúdo fique sob o header não-transparente */}
      <div aria-hidden className="h-0" />

      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden fixed inset-0 z-50 bg-background/98 backdrop-blur-sm flex flex-col"
          >
            <div className="container-x flex items-center justify-between h-16">
              <Image
                src="/logor.png"
                alt="Barbearia Resenha"
                width={200}
                height={200}
                className="h-10 w-auto"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid place-items-center h-10 w-10 -mr-2 text-foreground"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <nav
              aria-label="Mobile"
              className="container-x flex-1 flex flex-col justify-center gap-1 -mt-12"
            >
              {navLinks.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4 }}
                >
                  <Link
                    href={l.href}
                    className={cn(
                      "block font-display text-4xl py-3 transition-colors",
                      pathname === l.href
                        ? "text-accent"
                        : "text-foreground hover:text-accent"
                    )}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              <div className="flex flex-col gap-3 mt-12">
                <Button asChild size="lg">
                  <Link href="/agendar">Agendar horário</Link>
                </Button>
                {loggedIn === false && (
                  <Button asChild variant="outline" size="lg">
                    <Link href="/entrar">Entrar / Cadastrar</Link>
                  </Button>
                )}
                {loggedIn === true && (
                  <Button asChild variant="outline" size="lg">
                    <Link href="/minha-conta">Minha conta</Link>
                  </Button>
                )}
              </div>
            </nav>

            <div className="container-x py-8 text-sm text-muted">
              <p>{siteConfig.address.full}</p>
              <p className="mt-1">{siteConfig.phoneDisplay}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
