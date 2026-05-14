import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { InstagramIcon } from "@/components/marketing/social-icons";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Equipe",
  description:
    "Conheça os barbeiros da Resenha e Corte: especialidades, anos de profissão e formas de agendar com cada um.",
};

export default async function EquipePage() {
  const supabase = await createClient();
  const { data: barbers } = await supabase
    .from("barbers")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const items = barbers ?? [];

  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-32">
      <div className="container-x">
        <header className="max-w-3xl mb-16 md:mb-24">
          <span className="eyebrow flex items-center gap-3">
            <span className="gold-rule" /> Quem é quem
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl xl:text-7xl">
            A equipe que te atende.
          </h1>
          <p className="mt-6 text-foreground/75 leading-relaxed text-lg">
            Profissionais que escolhemos a dedo e que escolhem cada
            ferramenta. Trabalho artesanal, padrão consistente.
          </p>
        </header>

        <div className="space-y-24 md:space-y-32">
          {items.map((b, i) => (
            <Reveal
              key={b.id}
              as="article"
              className={`grid lg:grid-cols-12 gap-10 lg:gap-16 items-center ${
                i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="lg:col-span-5">
                <div className="relative aspect-[4/5] max-w-[440px] mx-auto lg:mx-0">
                  <div
                    aria-hidden
                    className={`absolute inset-0 ${
                      i % 2 === 1
                        ? "-translate-x-4 translate-y-4"
                        : "translate-x-4 translate-y-4"
                    } border border-accent rounded-sm`}
                  />
                  <div className="relative h-full w-full overflow-hidden rounded-sm">
                    {b.photo_url && (
                      <Image
                        src={b.photo_url}
                        alt={b.name}
                        fill
                        sizes="(min-width: 1024px) 440px, 90vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  <span className="eyebrow flex items-center gap-3">
                    <span className="gold-rule" /> Barbeiro 0{i + 1}
                  </span>
                  <h2 className="text-4xl md:text-5xl">{b.name}</h2>
                </div>

                {b.bio && (
                  <p className="text-foreground/80 leading-relaxed text-lg">
                    {b.bio}
                  </p>
                )}

                {b.specialties.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">
                      Especialidades
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {b.specialties.map((spec) => (
                        <li
                          key={spec}
                          className="text-xs text-foreground/85 px-3 py-1.5 border border-border rounded-full"
                        >
                          {spec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Button asChild size="md">
                    <Link href={`/agendar?barber=${b.id}`}>
                      Agendar com {b.name.split(" ")[0]}
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  {b.instagram && (
                    <Button asChild variant="ghost" size="md">
                      <a
                        href={b.instagram}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <InstagramIcon className="h-4 w-4" />
                        Instagram
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
