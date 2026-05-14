import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { siteConfig, navLinks } from "@/lib/site";
import { InstagramIcon, FacebookIcon } from "./social-icons";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background mt-0">
      <div className="container-x py-16 md:py-20 grid lg:grid-cols-12 gap-10 md:gap-14">
        {/* Coluna identidade */}
        <div className="lg:col-span-4 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center"
            aria-label="Resenha e Corte — início"
          >
            <Image
              src="/logor.png"
              alt="Barbearia Resenha"
              width={200}
              height={200}
              className="h-16 w-auto"
            />
          </Link>
          <p className="text-sm text-muted leading-relaxed max-w-sm">
            Barbearia premium em Itabira, MG. Tradição, técnica e respeito pelo
            tempo de cada cliente.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram"
              className="grid place-items-center h-10 w-10 rounded-full border border-border text-foreground/80 hover:border-accent hover:text-accent transition-colors"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a
              href={siteConfig.social.facebook}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Facebook"
              className="grid place-items-center h-10 w-10 rounded-full border border-border text-foreground/80 hover:border-accent hover:text-accent transition-colors"
            >
              <FacebookIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Navegação */}
        <div className="lg:col-span-2">
          <h3 className="text-xs uppercase tracking-[0.2em] text-accent">
            Navegação
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-foreground/75 hover:text-accent transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/agendar"
                className="text-foreground/75 hover:text-accent transition-colors"
              >
                Agendar
              </Link>
            </li>
            <li>
              <Link
                href="/entrar"
                className="text-foreground/75 hover:text-accent transition-colors"
              >
                Entrar
              </Link>
            </li>
          </ul>
        </div>

        {/* Visite + horários */}
        <div className="lg:col-span-3 space-y-5">
          <h3 className="text-xs uppercase tracking-[0.2em] text-accent">
            Visite
          </h3>
          <ul className="space-y-3 text-sm text-foreground/75">
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-accent mt-0.5 shrink-0" aria-hidden />
              <a
                href={siteConfig.address.mapsLink}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-accent transition-colors"
              >
                {siteConfig.address.full}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-accent shrink-0" aria-hidden />
              <a
                href={`tel:${siteConfig.phone}`}
                className="hover:text-accent transition-colors"
              >
                {siteConfig.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-accent shrink-0" aria-hidden />
              <a
                href={`mailto:${siteConfig.email}`}
                className="hover:text-accent transition-colors break-all"
              >
                {siteConfig.email}
              </a>
            </li>
          </ul>

          <ul className="pt-2 space-y-1 text-sm text-foreground/75">
            {siteConfig.hours.map((h) => (
              <li key={h.label} className="flex justify-between gap-4">
                <span>{h.label}</span>
                <span className="text-muted">{h.value}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mapa embed */}
        <div className="lg:col-span-3">
          <h3 className="text-xs uppercase tracking-[0.2em] text-accent">
            Como chegar
          </h3>
          <div className="mt-5 aspect-[4/3] rounded-sm overflow-hidden border border-border">
            <iframe
              title="Mapa — Resenha e Corte"
              src={siteConfig.address.mapsEmbed}
              className="h-full w-full grayscale-[0.6] contrast-[1.05] opacity-90"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-x py-6 text-xs text-muted text-center md:text-left">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
