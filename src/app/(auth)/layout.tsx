import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@/lib/site";

const SIDE_IMAGE =
  "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?auto=format&fit=crop&w=1600&q=85";

/**
 * Layout split-screen para /entrar, /cadastrar, /recuperar-senha.
 * Esquerda: formulário (max 420px), centralizado verticalmente.
 * Direita: imagem editorial em B&W com sobreposição da marca + frase.
 * Mobile: vira coluna única, imagem some.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh grid grid-cols-1 lg:grid-cols-2">
      {/* Coluna do formulário */}
      <div className="flex flex-col bg-background">
        <header className="container-x pt-6 pb-2 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao site
          </Link>
          <Link href="/" className="lg:hidden inline-flex items-center">
            <Image
              src="/logor.png"
              alt="Barbearia Resenha"
              width={200}
              height={200}
              className="h-10 w-auto"
            />
          </Link>
        </header>

        <div className="flex-1 grid place-items-center px-6 py-10 md:py-14">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        <footer className="container-x py-6 text-xs text-muted">
          © {new Date().getFullYear()} {siteConfig.name}
        </footer>
      </div>

      {/* Coluna editorial */}
      <aside
        aria-hidden
        className="hidden lg:block relative overflow-hidden border-l border-border"
      >
        <Image
          src={SIDE_IMAGE}
          alt=""
          fill
          sizes="50vw"
          className="object-cover grayscale"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/40 to-background/80" />

        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link
            href="/"
            className="inline-flex items-center text-foreground"
            aria-label="Resenha e Corte — início"
          >
            <Image
              src="/logor.png"
              alt="Barbearia Resenha"
              width={240}
              height={240}
              priority
              className="h-20 w-auto"
            />
          </Link>

          <div className="max-w-md">
            <span className="eyebrow flex items-center gap-3">
              <span className="gold-rule" /> Itabira · MG
            </span>
            <p className="mt-5 font-display text-3xl xl:text-4xl text-foreground leading-snug">
              “O bom corte começa antes da tesoura — começa na conversa.”
            </p>
            <p className="mt-4 text-sm text-muted">
              {siteConfig.address.full}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
