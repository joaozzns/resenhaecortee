import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { Reveal } from "./Reveal";

const CTA_IMAGE =
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=2400&q=85";

export function FinalCTA() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden"
    >
      <Image
        src={CTA_IMAGE}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/70"
      />

      <div className="container-x relative z-10 py-24 md:py-36">
        <Reveal as="div" className="max-w-3xl">
          <span className="eyebrow flex items-center gap-3">
            <span className="gold-rule" /> Pronto para o próximo corte?
          </span>
          <h2
            id="cta-heading"
            className="mt-6 text-4xl md:text-5xl xl:text-7xl text-foreground"
          >
            Reserve seu horário em menos de um minuto.
          </h2>
          <p className="mt-6 text-foreground/75 text-lg max-w-xl leading-relaxed">
            Escolha o serviço, o barbeiro e o melhor horário para você.
            Confirmação imediata, lembretes automáticos.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/agendar">
                Agendar agora
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`tel:${siteConfig.phone}`}>
                <Phone className="h-4 w-4" aria-hidden />
                {siteConfig.phoneDisplay}
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
