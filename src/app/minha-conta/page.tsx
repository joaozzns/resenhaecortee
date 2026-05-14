import Link from "next/link";
import { ArrowRight, Calendar, History, Repeat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AppointmentCard } from "@/components/account/AppointmentCard";
import { requireAuth } from "@/lib/auth/helpers";
import {
  getMyAppointments,
  getClientStats,
  getLastAppointment,
} from "@/lib/account/queries";

export const metadata = { title: "Minha conta" };

export default async function OverviewPage() {
  const me = await requireAuth("/minha-conta");
  const [upcoming, stats, last] = await Promise.all([
    getMyAppointments(me.id, "upcoming"),
    getClientStats(me.id),
    getLastAppointment(me.id),
  ]);

  const firstName =
    me.profile?.full_name?.split(" ")[0] ?? me.email?.split("@")[0] ?? "Cliente";
  const next = upcoming[0];

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Olá de novo
        </span>
        <h1 className="text-3xl md:text-4xl xl:text-5xl">
          Bem-vindo de volta, {firstName}.
        </h1>
        <p className="text-foreground/70 leading-relaxed max-w-2xl">
          {next
            ? "Seu próximo horário está confirmado abaixo."
            : "Você não tem agendamentos ativos. Que tal marcar o próximo?"}
        </p>
      </header>

      {next ? (
        <section aria-label="Próximo agendamento">
          <h2 className="sr-only">Próximo</h2>
          <AppointmentCard appointment={next} variant="highlight" />
        </section>
      ) : (
        <Card>
          <CardBody className="py-10 text-center">
            <Calendar className="h-8 w-8 text-accent mx-auto" aria-hidden />
            <p className="mt-4 text-foreground/85">
              Sem agendamentos por enquanto.
            </p>
            <Button asChild size="md" className="mt-6">
              <Link href="/agendar">
                Agendar agora <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Atalhos */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {last && (
          <Card>
            <CardBody className="py-6">
              <Repeat className="h-5 w-5 text-accent" aria-hidden />
              <h3 className="mt-3 font-display text-lg">Repetir último corte</h3>
              <p className="mt-1 text-sm text-muted">
                Reserva 1-clique com o mesmo serviço e barbeiro.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link
                  href={`/agendar?services=${last.serviceIds.join(",")}&barber=${last.barberId}`}
                >
                  Repetir <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="py-6">
            <History className="h-5 w-5 text-accent" aria-hidden />
            <h3 className="mt-3 font-display text-lg">Total de visitas</h3>
            <p className="mt-1 font-display text-3xl text-foreground">
              {stats.totalVisits}
            </p>
            <p className="mt-1 text-xs text-muted">
              Você é cliente da casa.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="py-6">
            <Sparkles className="h-5 w-5 text-accent" aria-hidden />
            <h3 className="mt-3 font-display text-lg">Suas preferências</h3>
            <ul className="mt-2 space-y-1 text-sm text-foreground/85">
              <li>
                <span className="text-muted">Barbeiro favorito:</span>{" "}
                {stats.favoriteBarberName ?? "—"}
              </li>
              <li>
                <span className="text-muted">Serviço mais usado:</span>{" "}
                {stats.topServiceName ?? "—"}
              </li>
            </ul>
          </CardBody>
        </Card>
      </section>

      {/* Próximos abaixo do destacado */}
      {upcoming.length > 1 && (
        <section className="space-y-5">
          <header className="flex items-end justify-between">
            <h2 className="font-display text-2xl">Próximos</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/minha-conta/agendamentos">
                Ver todos <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </header>
          <div className="grid md:grid-cols-2 gap-4">
            {upcoming.slice(1, 3).map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
