import { createAdminClient } from "@/lib/supabase/server";
import { BlocksAdmin } from "./BlocksAdmin";

export const metadata = { title: "Bloqueios (admin)" };

export default async function AdminBlocksPage() {
  const admin = createAdminClient();
  const [{ data: blocks }, { data: barbers }] = await Promise.all([
    admin
      .from("time_blocks")
      .select("*, barber:barbers(name)")
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
    admin
      .from("barbers")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Folgas e pausas
        </span>
        <h1 className="text-3xl md:text-4xl">Bloqueios de horário</h1>
        <p className="text-foreground/70 max-w-2xl">
          Almoços, folgas, compromissos. Slots dentro do bloqueio somem do
          /agendar automaticamente.
        </p>
      </header>

      <BlocksAdmin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blocks={(blocks ?? []) as any}
        barbers={barbers ?? []}
      />
    </div>
  );
}
