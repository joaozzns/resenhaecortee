import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/**
 * Sitemap dinâmico — lista as rotas públicas. Rotas autenticadas
 * (/minha-conta, /admin) ficam de fora propositalmente.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const lastmod = new Date();

  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/servicos", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/equipe", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contato", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/agendar", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/entrar", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/cadastrar", priority: 0.4, changeFrequency: "yearly" as const },
  ];

  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: lastmod,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
