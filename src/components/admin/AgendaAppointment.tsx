"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Phone, Mail, X, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setAppointmentStatus } from "@/app/admin/actions";
import { buildAppointmentConfirmLink } from "@/lib/whatsapp";
import { fmtBRT } from "@/lib/date";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type AgendaAppt = {
  id: string;
  starts_at: string;
  status: string;
  client_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  barber_name: string | null;
  total_cents: number;
  services: { name: string; price_cents: number }[];
};

const STATUS_STYLE: Record<
  string,
  { border: string; dot: string; timeText: string }
> = {
  pending: { border: "border-amber-400/80", dot: "bg-amber-400", timeText: "text-amber-400" },
  confirmed: { border: "border-success/80", dot: "bg-success", timeText: "text-success" },
  completed: { border: "border-accent/80", dot: "bg-accent", timeText: "text-accent" },
  no_show: { border: "border-muted/60", dot: "bg-muted", timeText: "text-muted" },
  cancelled: { border: "border-danger/80", dot: "bg-danger", timeText: "text-danger" },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Concluído",
  no_show: "Não compareceu",
  cancelled: "Cancelado",
};

export function AgendaAppointment({ appt }: { appt: AgendaAppt }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_STYLE[appt.status] ?? STATUS_STYLE.confirmed;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`${fmtBRT(appt.starts_at, "HH:mm")} · ${appt.client_name} · ${formatBRL(appt.total_cents)}`}
        className={cn(
          "group w-full rounded-md border-l-2 p-2 bg-surface text-left text-foreground transition-colors hover:bg-surface-2 cursor-pointer",
          cfg.border
        )}
      >
        <div className="flex items-baseline justify-between gap-1.5 mb-0.5">
          <span className={cn("font-display text-sm tabular-nums leading-none", cfg.timeText)}>
            {fmtBRT(appt.starts_at, "HH:mm")}
          </span>
          <span aria-hidden className={cn("inline-block h-1.5 w-1.5 rounded-full", cfg.dot)} />
        </div>
        <p className="font-medium text-[11px] leading-tight truncate">{appt.client_name}</p>
        <p className="text-[10px] text-muted tabular-nums leading-tight mt-0.5">
          {formatBRL(appt.total_cents)}
        </p>
      </button>

      {open && <ClientProfileModal appt={appt} onClose={() => setOpen(false)} />}
    </>
  );
}

function ClientProfileModal({
  appt,
  onClose,
}: {
  appt: AgendaAppt;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const waUrl = buildAppointmentConfirmLink({
    client_name: appt.client_name,
    client_phone: appt.client_phone,
    starts_at: appt.starts_at,
    barber_name: appt.barber_name,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function doCancel() {
    if (!confirm(`Cancelar o agendamento de ${appt.client_name}?`)) return;
    startTransition(async () => {
      const r = await setAppointmentStatus(appt.id, "cancelled");
      if (!r.ok) toast.error("Falha ao cancelar", { description: r.error });
      else {
        toast.success("Agendamento cancelado.");
        router.refresh();
        onClose();
      }
    });
  }

  const cancelled = appt.status === "cancelled";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Perfil de ${appt.client_name}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col rounded-[var(--radius-lg)] border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-accent">
              <UserRound className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg leading-tight">
                {appt.client_name}
              </h2>
              <p className="text-xs text-muted">{STATUS_LABEL[appt.status] ?? appt.status}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Contato */}
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent shrink-0" aria-hidden />
              <span className="text-foreground/90">{appt.client_phone ?? "—"}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent shrink-0" aria-hidden />
              <span className="text-foreground/90 truncate">
                {appt.client_email ?? "—"}
              </span>
            </p>
          </div>

          <div className="rounded-[var(--radius)] border border-border bg-surface-2/40 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted text-xs uppercase tracking-wide">Quando</span>
              <span className="tabular-nums">
                {fmtBRT(appt.starts_at, "dd/MM 'às' HH:mm")} BRT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted text-xs uppercase tracking-wide">Barbeiro</span>
              <span>{appt.barber_name ?? "—"}</span>
            </div>
            {appt.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {appt.services.map((s, i) => (
                  <span
                    key={`${appt.id}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-foreground/85"
                  >
                    {s.name}
                    <span className="text-muted tabular-nums">{formatBRL(s.price_cents)}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted text-xs uppercase tracking-wide">Total</span>
              <span className="font-display text-lg tabular-nums">
                {formatBRL(appt.total_cents)}
              </span>
            </div>
          </div>

          {appt.client_id && (
            <Link
              href={`/admin/clientes/${appt.client_id}`}
              className="inline-block text-xs text-accent hover:underline"
            >
              Ver ficha completa do cliente →
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
          {waUrl && (
            <Button asChild variant="outline" size="sm" className="sm:flex-none">
              <a href={waUrl} target="_blank" rel="noreferrer noopener">
                <MessageCircle className="h-4 w-4" aria-hidden />
                Enviar mensagem
              </a>
            </Button>
          )}
          {!cancelled && (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={doCancel}
              disabled={pending}
              className="text-danger hover:text-danger sm:flex-none"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <X className="h-4 w-4" aria-hidden />
              )}
              Cancelar agendamento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
