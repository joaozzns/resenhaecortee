import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/ContactForm";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Resenha e Corte. Endereço, telefone, WhatsApp e formulário de contato.",
};

const waUrl = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
  siteConfig.whatsappMessage
)}`;

export default function ContatoPage() {
  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-32">
      <div className="container-x">
        <header className="max-w-3xl mb-14 md:mb-20">
          <span className="eyebrow flex items-center gap-3">
            <span className="gold-rule" /> Contato
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl xl:text-7xl">
            Vamos marcar uma conversa.
          </h1>
          <p className="mt-6 text-foreground/75 leading-relaxed text-lg">
            WhatsApp para falar agora, formulário se preferir e-mail, ou venha
            sem agendar para conhecer o estúdio. Estamos no centro de Itabira.
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Coluna formulário */}
          <div className="lg:col-span-7">
            <h2 className="text-2xl font-display mb-6">Mande uma mensagem</h2>
            <ContactForm />
          </div>

          {/* Coluna informações */}
          <aside className="lg:col-span-5 space-y-8">
            <div>
              <h2 className="text-2xl font-display mb-6">Informações</h2>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <span className="grid place-items-center h-10 w-10 rounded-full bg-accent-soft text-accent shrink-0">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">
                      Endereço
                    </p>
                    <a
                      href={siteConfig.address.mapsLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1 block text-foreground hover:text-accent transition-colors"
                    >
                      {siteConfig.address.full}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="grid place-items-center h-10 w-10 rounded-full bg-accent-soft text-accent shrink-0">
                    <Phone className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">
                      Telefone
                    </p>
                    <a
                      href={`tel:${siteConfig.phone}`}
                      className="mt-1 block text-foreground hover:text-accent transition-colors"
                    >
                      {siteConfig.phoneDisplay}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="grid place-items-center h-10 w-10 rounded-full bg-accent-soft text-accent shrink-0">
                    <Mail className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">
                      E-mail
                    </p>
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="mt-1 block text-foreground hover:text-accent transition-colors break-all"
                    >
                      {siteConfig.email}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="grid place-items-center h-10 w-10 rounded-full bg-accent-soft text-accent shrink-0">
                    <Clock className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">
                      Horário
                    </p>
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {siteConfig.hours.map((h) => (
                        <li
                          key={h.label}
                          className="flex justify-between gap-6 text-foreground/85"
                        >
                          <span>{h.label}</span>
                          <span className="text-muted">{h.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="md">
                <a href={waUrl} target="_blank" rel="noreferrer noopener">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Falar no WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="md">
                <Link href="/agendar">Ir direto para agendar</Link>
              </Button>
            </div>

            <div className="aspect-[4/3] rounded-sm overflow-hidden border border-border">
              <iframe
                title="Mapa — Resenha e Corte"
                src={siteConfig.address.mapsEmbed}
                className="h-full w-full grayscale-[0.6] contrast-[1.05] opacity-90"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
