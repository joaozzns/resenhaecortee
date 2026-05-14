import { createAdminClient } from "@/lib/supabase/server";
import { BarbersAdmin } from "./BarbersAdmin";

export const metadata = { title: "Barbeiros (admin)" };

export default async function AdminBarbeirosPage() {
  const admin = createAdminClient();
  const { data: barbers } = await admin
    .from("barbers")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Equipe
        </span>
        <h1 className="text-3xl md:text-4xl">Barbeiros</h1>
        <p className="text-foreground/70 max-w-2xl">
          Cadastre profissionais e mantenha bios e fotos em dia.
        </p>
      </header>

      <BarbersAdmin barbers={barbers ?? []} />
    </div>
  );
}
