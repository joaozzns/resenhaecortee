"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=2400&q=85";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      aria-label="Apresentação"
      className="relative min-h-[100svh] flex items-end overflow-hidden"
    >
      {/* Imagem de fundo cobrindo a viewport */}
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Camadas de overlay: gradiente vertical + leve viñeta para legibilidade */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/30"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_30%,transparent_0%,rgba(14,14,14,0.55)_60%,rgba(14,14,14,0.95)_100%)]"
      />

      <div className="container-x relative z-10 pb-20 md:pb-28 pt-40 md:pt-52">
        <div className="max-w-3xl">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow flex items-center gap-3"
          >
            <span className="gold-rule" />
            A 01 de Itabira
          </motion.span>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-hero italic text-5xl sm:text-6xl md:text-7xl xl:text-8xl text-foreground tracking-tight leading-[1.02]"
          >
            {siteConfig.tagline}
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 text-lg md:text-xl text-foreground/80 max-w-xl leading-relaxed"
          >
            Oferecemos uma experiência exclusiva para quem valoriza estilo,
            conforto e praticidade. Aqui, você tem acesso aos melhores
            serviços sempre que precisar, com a qualidade que seu visual
            merece.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col sm:flex-row gap-3"
          >
            <Button asChild size="lg">
              <Link href="/agendar">
                Agendar horário
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/servicos">Conhecer serviços</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Indicador de scroll — pulsa gentil. Marcado aria-hidden por ser puramente decorativo. */}
      <motion.div
        aria-hidden
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-[0.32em] uppercase text-foreground/60">
          Role
        </span>
        <span className="block h-10 w-px bg-gradient-to-b from-accent to-transparent" />
      </motion.div>
    </section>
  );
}
