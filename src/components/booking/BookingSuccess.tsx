"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Service, Barber, BookingState } from "@/lib/booking/types";
import { siteConfig } from "@/lib/site";
import { formatBRL } from "@/lib/utils";

/**
 * Tela final pós-agendamento. Exibe o número curto do pedido (8 chars do
 * UUID), gera link Google Calendar e link WhatsApp pré-preenchido.
 */
export function BookingSuccess({
  appointmentId,
  cancelToken,
  state,
  services,
  barbers,
  createdAccount,
}: {
  appointmentId: string;
  cancelToken: string;
  state: BookingState;
  services: Service[];
  barbers: Barber[];
  createdAccount: boolean;
}) {
  const selected = services.filter((s) => state.serviceIds.includes(s.id));
  const totalCents = selected.reduce((s, x) => s + x.price_cents, 0);
  const totalDuration = selected.reduce(
    (s, x) => s + x.duration_minutes,
    0
  );
  const startsAt = state.startsAtUtc ? new Date(state.startsAtUtc) : null;
  const endsAt = state.endsAtUtc ? new Date(state.endsAtUtc) : null;
  const barber =
    state.barberId && state.barberId !== "any"
      ? barbers.find((b) => b.id === state.barberId)
      : null;

  const shortId = appointmentId.slice(0, 8).toUpperCase();
  const titleSummary = selected.map((s) => s.name).join(" + ");

  const gcalUrl = (() => {
    if (!startsAt || !endsAt) return null;
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${siteConfig.name} — ${titleSummary}`,
      dates: `${fmt(startsAt)}/${fmt(endsAt)}`,
      details: `Agendamento #${shortId}\nBarbeiro: ${barber?.name ?? "Sem preferência"}\nTotal: ${formatBRL(totalCents)}`,
      location: siteConfig.address.full,
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
  })();

  const waMessage = startsAt
    ? `Olá! Confirmei meu agendamento #${shortId} na Resenha e Corte para ${format(startsAt, "dd/MM 'às' HH:mm", { locale: ptBR })}. ${titleSummary}.`
    : `Olá! Confirmei meu agendamento #${shortId} na Resenha e Corte.`;
  const waUrl = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(waMessage)}`;
  const cancelUrl = `${siteConfig.url}/agendar/cancelar?token=${cancelToken}`;

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="grid place-items-center">
        <span className="grid place-items-center h-16 w-16 rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </span>
      </div>

      <div className="space-y-3">
        <span className="eyebrow flex items-center justify-center gap-3">
          <span className="gold-rule" /> Confirmado <span className="gold-rule" />
        </span>
        <h1 className="text-4xl md:text-5xl font-display">
          Tá marcado.
        </h1>
        <p className="text-foreground/75 text-lg leading-relaxed">
          Anotamos seu horário. Mandamos um e-mail com os detalhes.
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 md:p-8 text-left space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Número do pedido
            </p>
            <p className="font-display text-2xl text-accent">#{shortId}</p>
          </div>
          {startsAt && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                Quando
              </p>
              <p className="font-display text-xl">
                {format(startsAt, "dd 'de' MMMM", { locale: ptBR })}
                <span className="text-accent">
                  {" "}
                  · {format(startsAt, "HH:mm")}
                </span>
              </p>
            </div>
          )}
        </div>

        <hr className="border-border" />

        <ul className="space-y-2 text-sm">
          {selected.map((s) => (
            <li key={s.id} className="flex justify-between">
              <span className="text-foreground/85">{s.name}</span>
              <span className="text-muted tabular-nums">
                {formatBRL(s.price_cents)}
              </span>
            </li>
          ))}
        </ul>

        <hr className="border-border" />

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Barbeiro</dt>
            <dd className="mt-0.5">
              {barber ? barber.name : "Sem preferência"}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-muted">Duração</dt>
            <dd className="mt-0.5 tabular-nums">{totalDuration} min</dd>
          </div>
          <div>
            <dt className="text-muted">Endereço</dt>
            <dd className="mt-0.5 text-foreground/85">
              {siteConfig.address.full}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-muted">Total</dt>
            <dd className="mt-0.5 font-display text-xl text-foreground">
              {formatBRL(totalCents)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {gcalUrl && (
          <Button asChild variant="outline" size="md">
            <a href={gcalUrl} target="_blank" rel="noreferrer noopener">
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Adicionar ao Google Calendar
            </a>
          </Button>
        )}
        <Button asChild variant="outline" size="md">
          <a href={waUrl} target="_blank" rel="noreferrer noopener">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Avisar no WhatsApp
          </a>
        </Button>
      </div>

      {createdAccount && (
        <p className="text-sm text-muted">
          Enviamos um e-mail para você confirmar a sua nova conta.
        </p>
      )}

      <div className="flex items-center justify-center gap-4 text-sm">
        <Button asChild variant="primary" size="md">
          <Link href="/minha-conta/agendamentos">
            Ver meus agendamentos
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Voltar ao site</Link>
        </Button>
      </div>

      <p className="pt-4 text-xs text-muted">
        Precisa cancelar? Use o link enviado por e-mail ou{" "}
        <Link href={cancelUrl} className="underline hover:text-accent">
          clique aqui
        </Link>
        .
      </p>
    </div>
  );
}
