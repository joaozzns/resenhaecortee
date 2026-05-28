import { createAdminClient } from "@/lib/supabase/server";
import { NewAppointmentForm } from "./NewAppointmentForm";

export const metadata = { title: "Novo agendamento" };

export default async function NewAppointmentPage() {
  const admin = createAdminClient();
  const [{ data: services }, { data: barbers }] = await Promise.all([
    admin
      .from("services")
      .select("id, name, category, duration_minutes, price_cents")
      .eq("active", true)
      .order("sort_order"),
    admin
      .from("barbers")
      .select("id, name")
      .eq("active", true)
      .order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Manual
        </span>
        <h1 className="text-3xl md:text-4xl">Novo agendamento</h1>
        <p className="text-muted text-sm max-w-xl">
          Marque um horário pra um cliente que ligou, mandou WhatsApp ou
          apareceu na barbearia. Já entra como <strong>confirmado</strong>.
        </p>
      </header>

      <NewAppointmentForm
        services={services ?? []}
        barbers={barbers ?? []}
      />
    </div>
  );
}
