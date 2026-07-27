import type { Metadata, Viewport } from "next";
import { Syne } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Fonte única do site — Syne. É variável (400–800), então uma só instância
// cobre corpo (peso normal) e títulos (bold).
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Resenha e Corte — Barbearia Premium em Itabira",
    template: "%s · Resenha e Corte",
  },
  description:
    "Barbearia premium em Itabira/MG. Cortes, barba e tratamentos com agendamento online. Rua Esmeralda, 511.",
  keywords: [
    "barbearia",
    "barbearia premium",
    "Itabira",
    "corte masculino",
    "barba",
    "agendamento online",
    "Resenha e Corte",
  ],
  authors: [{ name: "Resenha e Corte" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Resenha e Corte",
    title: "Resenha e Corte — Barbearia Premium em Itabira",
    description:
      "O corte que define seu estilo. Agendamento online em poucos cliques.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resenha e Corte",
    description:
      "Barbearia premium em Itabira/MG com agendamento online.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E0E0E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${syne.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}
