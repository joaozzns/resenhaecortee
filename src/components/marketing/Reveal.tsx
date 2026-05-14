"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wrapper que faz fade + slide de baixo quando o elemento entra na tela.
 * Respeita prefers-reduced-motion: usuário com motion reduzido vê o
 * conteúdo aparecer sem animação.
 *
 * Use-once: animação não roda novamente em re-views, evita "respiração"
 * desnecessária quando o usuário scrolla pra cima e pra baixo.
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer" | "li" | "ul";
}) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[Tag];

  if (prefersReducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}
