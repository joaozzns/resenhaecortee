import { requireAuth } from "@/lib/auth/helpers";
import { getMyAppointments } from "@/lib/account/queries";
import { AppointmentTabs } from "./AppointmentTabs";

export const metadata = { title: "Meus agendamentos" };

export default async function AgendamentosPage() {
  const me = await requireAuth("/minha-conta/agendamentos");
  const [upcoming, past, cancelled] = await Promise.all([
    getMyAppointments(me.id, "upcoming"),
    getMyAppointments(me.id, "past"),
    getMyAppointments(me.id, "cancelled"),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Agenda
        </span>
        <h1 className="text-3xl md:text-4xl">Meus agendamentos</h1>
        <p className="text-foreground/70 max-w-2xl">
          Próximos, histórico e cancelamentos. Você pode reagendar, avaliar e
          cancelar diretamente daqui.
        </p>
      </header>

      <AppointmentTabs
        upcoming={upcoming}
        past={past}
        cancelled={cancelled}
      />
    </div>
  );
}
