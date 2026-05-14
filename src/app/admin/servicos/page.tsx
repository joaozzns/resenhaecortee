import { createAdminClient } from "@/lib/supabase/server";
import { ServicesAdmin } from "./ServicesAdmin";

export const metadata = { title: "Serviços (admin)" };

export default async function AdminServicosPage() {
  const admin = createAdminClient();
  const { data: services } = await admin
    .from("services")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Catálogo
        </span>
        <h1 className="text-3xl md:text-4xl">Serviços</h1>
        <p className="text-foreground/70 max-w-2xl">
          Adicionar, editar ou desativar serviços. Itens desativados somem do
          site mas permanecem no histórico.
        </p>
      </header>

      <ServicesAdmin services={services ?? []} />
    </div>
  );
}
