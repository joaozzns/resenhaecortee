"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { testimonials } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const AUTOPLAY_MS = 6500;

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % testimonials.length),
    []
  );
  const prev = useCallback(
    () =>
      setIndex((i) => (i - 1 + testimonials.length) % testimonials.length),
    []
  );

  // Autoplay — pausa quando o cursor está sobre o carrossel ou prefers-reduced
  useEffect(() => {
    if (paused || reduce) return;
    const id = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, next, reduce]);

  // Pausa também quando o carrossel sai da viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => setPaused(!entries[0].isIntersecting),
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const current = testimonials[index];

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="py-24 md:py-32 bg-surface/40"
    >
      <div className="container-x">
        <Reveal as="header" className="max-w-2xl mx-auto text-center mb-14">
          <span className="eyebrow inline-flex items-center gap-3">
            <span className="gold-rule" /> Depoimentos{" "}
            <span className="gold-rule" />
          </span>
          <h2 id="testimonials-heading" className="mt-5 text-4xl md:text-5xl">
            O que dizem nossos clientes.
          </h2>
        </Reveal>

        <div
          ref={containerRef}
          className="relative max-w-3xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <Quote
            className="absolute -top-4 -left-2 h-16 w-16 text-accent/20"
            aria-hidden
          />

          <div className="min-h-[260px] md:min-h-[220px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.figure
                key={index}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full text-center px-2 md:px-12"
              >
                <blockquote>
                  <p className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground leading-snug">
                    “{current.quote}”
                  </p>
                </blockquote>
                <figcaption className="mt-8 flex flex-col items-center gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {current.author}
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted">
                    {current.role}
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={prev}
              className="grid place-items-center h-10 w-10 rounded-full border border-border text-foreground/80 hover:border-accent hover:text-accent transition-colors"
              aria-label="Depoimento anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>

            <ul className="flex items-center gap-2" role="tablist">
              {testimonials.map((t, i) => (
                <li key={t.author}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Mostrar depoimento ${i + 1} de ${testimonials.length}`}
                    onClick={() => setIndex(i)}
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-300",
                      i === index
                        ? "w-8 bg-accent"
                        : "w-3 bg-border hover:bg-border-strong"
                    )}
                  />
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={next}
              className="grid place-items-center h-10 w-10 rounded-full border border-border text-foreground/80 hover:border-accent hover:text-accent transition-colors"
              aria-label="Próximo depoimento"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
