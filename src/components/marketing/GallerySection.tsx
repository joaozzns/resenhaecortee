"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { galleryImages } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const ASPECT_CLASS = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  square: "aspect-square",
} as const;

/**
 * Galeria assimétrica em 3 colunas com lightbox próprio (sem dependência
 * extra). Navegação por teclado: Esc fecha, ← → trocam.
 */
export function GallerySection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const isOpen = openIdx !== null;

  const close = useCallback(() => setOpenIdx(null), []);
  const next = useCallback(
    () =>
      setOpenIdx((i) => (i === null ? null : (i + 1) % galleryImages.length)),
    []
  );
  const prev = useCallback(
    () =>
      setOpenIdx((i) =>
        i === null ? null : (i - 1 + galleryImages.length) % galleryImages.length
      ),
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close, next, prev]);

  return (
    <section
      id="galeria"
      aria-labelledby="gallery-heading"
      className="py-24 md:py-32 bg-surface/30"
    >
      <div className="container-x">
        <Reveal as="header" className="max-w-2xl mb-14 md:mb-20">
          <span className="eyebrow flex items-center gap-3">
            <span className="gold-rule" /> Galeria
          </span>
          <h2 id="gallery-heading" className="mt-5 text-4xl md:text-5xl xl:text-6xl">
            Trabalhos que falam por si.
          </h2>
          <p className="mt-5 text-foreground/70 leading-relaxed">
            Cortes, barbas e detalhes do dia-a-dia da casa. Clique em qualquer
            imagem para abrir.
          </p>
        </Reveal>

        <ul
          role="list"
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-min"
        >
          {galleryImages.map((img, i) => (
            <Reveal
              key={img.src}
              as="li"
              delay={(i % 3) * 0.06}
              className={cn(
                "relative overflow-hidden rounded-sm group",
                ASPECT_CLASS[img.aspect],
                // primeira imagem ocupa 2 linhas em desktop para ritmo
                i === 0 && "md:row-span-2 md:aspect-[3/5]"
              )}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(i)}
                className="absolute inset-0 group/btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Abrir imagem: ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-refined)] group-hover:scale-[1.05]"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <span
                  aria-hidden
                  className="absolute bottom-3 right-3 text-xs uppercase tracking-[0.2em] text-foreground/0 group-hover:text-foreground transition-colors duration-300"
                >
                  Ver
                </span>
              </button>
            </Reveal>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {isOpen && openIdx !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Visualizador de imagem"
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 grid place-items-center h-11 w-11 rounded-full border border-border text-foreground hover:border-accent hover:text-accent transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>

            <button
              type="button"
              onClick={prev}
              className="absolute left-4 md:left-8 grid place-items-center h-11 w-11 rounded-full border border-border text-foreground hover:border-accent hover:text-accent transition-colors"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>

            <button
              type="button"
              onClick={next}
              className="absolute right-4 md:right-8 grid place-items-center h-11 w-11 rounded-full border border-border text-foreground hover:border-accent hover:text-accent transition-colors"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>

            <motion.div
              key={openIdx}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl aspect-[4/3]"
            >
              <Image
                src={galleryImages[openIdx].src}
                alt={galleryImages[openIdx].alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </motion.div>

            <span className="absolute bottom-4 inset-x-0 text-center text-xs uppercase tracking-[0.24em] text-muted">
              {openIdx + 1} / {galleryImages.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
