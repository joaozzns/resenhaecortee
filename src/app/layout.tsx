import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, DM_Serif_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Fonte de hero — usada apenas no h1 da home para causar impacto.
// Alto contraste, italic disponível, vibe editorial premium.
const dmSerif = DM_Serif_Display({
  variable: "--font-hero",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
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
      className={`${inter.variable} ${playfair.variable} ${dmSerif.variable} h-full`}
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
