import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BarberCard } from "./BarberCard";
import { Reveal } from "./Reveal";

export async function TeamSection() {
  const supabase = await createClient();
  const { data: barbers } = await supabase
    .from("barbers")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const items = barbers ?? [];

  return (
    <section
      id="equipe"
      aria-labelledby="team-heading"
      className="py-24 md:py-32"
    >
      <div className="container-x">
        <Reveal as="header" className="flex items-end justify-between gap-8 flex-wrap mb-14 md:mb-20">
          <div className="max-w-2xl">
            <span className="eyebrow flex items-center gap-3">
              <span className="gold-rule" /> Equipe
            </span>
            <h2 id="team-heading" className="mt-5 text-4xl md:text-5xl xl:text-6xl">
              Quem vai cuidar do seu corte.
            </h2>
            <p className="mt-5 text-foreground/70 leading-relaxed">
              Cada profissional da casa tem sua especialidade. Escolha quem
              combina com o que você quer — ou agende sem preferência e a gente
              encaixa.
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="self-start md:self-end">
            <Link href="/equipe">
              Conhecer a equipe
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {items.map((b, i) => (
            <Reveal key={b.id} delay={(i % 3) * 0.08}>
              <BarberCard barber={b} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
