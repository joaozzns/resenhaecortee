"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CalendarPlus,
  Clock,
  Loader2,
  MessageCircle,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AppointmentWithDetails } from "@/lib/account/queries";
import { siteConfig } from "@/lib/site";
import { cancelMyAppointment, rateMyAppointment } from "@/app/minha-conta/actions";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Não compareceu",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-success",
  cancelled: "bg-danger",
  completed: "bg-accent",
  no_show: "bg-muted",
};

export function AppointmentCard({
  appointment,
  variant = "default",
}: {
  appointment: AppointmentWithDetails;
  variant?: "default" | "highlight";
}) {
  const [pending, startTransition] = useTransition();
  const [showRate, setShowRate] = useState(false);

  const startsAt = new Date(appointment.starts_at);
  const past = isPast(startsAt);
  const status = appointment.status;
  const total = appointment.total_cents;

  const titleSummary = appointment.services.map((s) => s.name).join(" + ");
  const shortId = appointment.id.slice(0, 8).toUpperCase();

  // WhatsApp pré-preenchido
  const waMessage = `Olá! Sobre meu agendamento #${shortId} (${format(
    startsAt,
    "dd/MM 'às' HH:mm",
    { locale: ptBR }
  )})…`;
  const waUrl = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(waMessage)}`;

  // Google Calendar
  const gcalUrl = (() => {
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const sp = new URLSearchParams({
      action: "TEMPLATE",
      text: `${siteConfig.name} — ${titleSummary}`,
      dates: `${fmt(startsAt)}/${fmt(new Date(appointment.ends_at))}`,
      location: siteConfig.address.full,
    });
    return `https://www.google.com/calendar/render?${sp.toString()}`;
  })();

  const repeatHref = `/agendar?services=${appointment.services
    .map((s) => s.service_id)
    .join(",")}&barber=${appointment.barber_id}`;

  function doCancel() {
    if (!confirm("Tem certeza que quer cancelar este agendamento?")) return;
    startTransition(async () => {
      const r = await cancelMyAppointment(appointment.id);
      if (!r.ok) toast.error("Falha", { description: r.error });
      else toast.success("Agendamento cancelado.");
    });
  }

  return (
    <article
      className={cn(
        "rounded-[var(--radius-lg)] border bg-surface p-5 md:p-6",
        variant === "highlight"
          ? "border-accent/60 bg-gradient-to-br from-surface to-accent-soft/40"
          : "border-border"
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                STATUS_DOT[status] ?? "bg-muted"
              )}
              aria-hidden
            />
            <span className="uppercase tracking-[0.18em]">
              {STATUS_LABEL[status] ?? status}
            </span>
            <span className="text-muted/60">·</span>
            <span className="tabular-nums">#{shortId}</span>
          </div>
          <h3 className="mt-1.5 font-display text-xl">{titleSummary}</h3>
        </div>
        <span className="font-display text-xl text-foreground tabular-nums">
          {formatBRL(total)}
        </span>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-accent mt-0.5" aria-hidden />
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
              Data
            </dt>
            <dd className="mt-0.5">
              {format(startsAt, "dd 'de' MMM, EEEE", { locale: ptBR })}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-accent mt-0.5" aria-hidden />
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
              Horário
            </dt>
            <dd className="mt-0.5 tabular-nums">{format(startsAt, "HH:mm")}</dd>
          </div>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
            Barbeiro
          </dt>
          <dd className="mt-0.5">{appointment.barber?.name ?? "—"}</dd>
        </div>
        {!past && (
          <div className="text-right">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
              Em
            </dt>
            <dd className="mt-0.5 text-accent">
              {formatDistanceToNow(startsAt, { locale: ptBR })}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {!past && status !== "cancelled" && (
          <>
            <Button asChild variant="outline" size="sm">
              <a href={gcalUrl} target="_blank" rel="noreferrer noopener">
                <CalendarPlus className="h-4 w-4" aria-hidden />
                Calendário
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={waUrl} target="_blank" rel="noreferrer noopener">
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={repeatHref}>Reagendar</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={doCancel}
              disabled={pending}
              className="text-danger hover:text-danger"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <X className="h-4 w-4" aria-hidden />
              )}
              Cancelar
            </Button>
          </>
        )}
        {past && status !== "cancelled" && (
          <>
            <Button asChild variant="primary" size="sm">
              <Link href={repeatHref}>Repetir esse corte</Link>
            </Button>
            {appointment.rating == null ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRate((s) => !s)}
              >
                <Star className="h-4 w-4" aria-hidden />
                Avaliar
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent">
                <Star className="h-4 w-4 fill-current" aria-hidden />
                {appointment.rating}/5
              </span>
            )}
          </>
        )}
      </div>

      {showRate && (
        <RateForm
          appointmentId={appointment.id}
          onDone={() => setShowRate(false)}
        />
      )}
    </article>
  );
}

function RateForm({
  appointmentId,
  onDone,
}: {
  appointmentId: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (rating === 0) return toast.error("Escolha de 1 a 5 estrelas.");
    startTransition(async () => {
      const r = await rateMyAppointment({
        appointmentId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        review: review || undefined,
      });
      if (!r.ok) toast.error("Falha", { description: r.error });
      else {
        toast.success("Obrigado pela avaliação!");
        onDone();
      }
    });
  }

  return (
    <div className="mt-5 pt-5 border-t border-border space-y-3">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="p-1 text-accent hover:scale-110 transition-transform"
            aria-label={`${n} estrelas`}
          >
            <Star
              className={cn(
                "h-6 w-6",
                n <= rating ? "fill-current" : "fill-none"
              )}
              aria-hidden
            />
          </button>
        ))}
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Comentário (opcional)"
        className="w-full rounded-[var(--radius)] bg-surface-2 border border-border px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-none"
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Enviar
        </Button>
      </div>
    </div>
  );
}
