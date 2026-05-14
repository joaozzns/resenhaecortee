import { credentials } from "@/lib/site";
import { Reveal } from "./Reveal";

export function CredentialsStrip() {
  return (
    <section
      aria-label="Métricas da barbearia"
      className="border-y border-border bg-surface/40"
    >
      <div className="container-x py-10 md:py-12">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
          {credentials.map((c, i) => (
            <Reveal
              key={c.label}
              delay={i * 0.06}
              as="li"
              className="text-center md:text-left flex flex-col gap-2"
            >
              <span className="font-display text-4xl md:text-5xl text-accent leading-none">
                {c.value}
              </span>
              <span className="text-xs md:text-sm text-muted uppercase tracking-[0.18em]">
                {c.label}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
