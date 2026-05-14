import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "./ServiceCard";
import { Reveal } from "./Reveal";

/**
 * Server Component — busca serviços diretamente do Supabase usando o
 * client de server (anon key, RLS pública para active=true).
 *
 * Mostra os 4 primeiros (ordenados por sort_order) e linka para /servicos
 * onde está a lista completa com filtros.
 */
export async function ServicesSection() {
  const supabase = await createClient();
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .limit(4);

  if (error) {
    console.error("[ServicesSection] erro ao buscar serviços:", error);
  }

  const items = services ?? [];

  return (
    <section
      id="servicos"
      aria-labelledby="services-heading"
      className="py-24 md:py-32 bg-background"
    >
      <div className="container-x">
        <Reveal as="header" className="flex items-end justify-between gap-8 flex-wrap mb-14 md:mb-20">
          <div className="max-w-2xl">
            <span className="eyebrow flex items-center gap-3">
              <span className="gold-rule" /> Serviços
            </span>
            <h2 id="services-heading" className="mt-5 text-4xl md:text-5xl xl:text-6xl">
              Tudo o que sua rotina exige, no lugar certo.
            </h2>
            <p className="mt-5 text-foreground/70 leading-relaxed">
              Do clássico corte com tesoura ao acabamento à navalha. Preço justo,
              tempo respeitado, técnica que se vê no espelho.
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="self-start md:self-end">
            <Link href="/servicos">
              Ver todos os serviços
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </Reveal>

        {items.length === 0 ? (
          <p className="text-muted">
            Em breve publicaremos a lista completa de serviços.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {items.map((s, i) => (
              <Reveal
                key={s.id}
                delay={(i % 3) * 0.08}
                className={i === 0 ? "lg:col-span-2" : ""}
              >
                <ServiceCard service={s} featured={i === 0} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
