import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ServicesCatalog } from "@/components/marketing/ServicesCatalog";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Cortes, barba, combos e tratamentos da Resenha e Corte. Preços, durações e agendamento online.",
};

export default async function ServicosPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-32">
      <div className="container-x">
        <header className="max-w-3xl mb-14 md:mb-20">
          <span className="eyebrow flex items-center gap-3">
            <span className="gold-rule" /> Catálogo
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl xl:text-7xl">
            Serviços e preços.
          </h1>
          <p className="mt-6 text-foreground/75 leading-relaxed text-lg">
            Tudo o que oferecemos no estúdio. Filtre por categoria,
            confira preço e duração e reserve seu horário em poucos cliques.
          </p>
        </header>

        <ServicesCatalog services={services ?? []} />
      </div>
    </div>
  );
}
