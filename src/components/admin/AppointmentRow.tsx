"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import {
  Check,
  CheckCircle2,
  Loader2,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setAppointmentStatus } from "@/app/admin/actions";
import { formatBRL, cn } from "@/lib/utils";

type Status = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

const STATUS_LABEL: Record<Status, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Faltou",
};

const STATUS_BG: Record<Status, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  confirmed: "bg-success/15 text-success border-success/40",
  cancelled: "bg-danger/15 text-danger border-danger/40",
  completed: "bg-accent/15 text-accent border-accent/40",
  no_show: "bg-muted/15 text-muted border-border",
};

export type AdminAppointmentRow = {
  id: string;
  starts_at: string;
  status: Status;
  client_name: string;
  total_cents: number;
  barber_name: string | null;
};

/**
 * Linha de agendamento usada no dashboard /admin.
 * Mostra status + botões contextuais:
 *  - pending  → Confirmar / Cancelar
 *  - confirmed (futuro) → Cancelar
 *  - confirmed (passado) → Concluir / Faltou / Cancelar
 *  - completed/cancelled/no_show → readonly
 */
export function AppointmentRow({ a }: { a: AdminAppointmentRow }) {
  const [pending, start] = useTransition();
  const past = new Date(a.starts_at) < new Date();

  function run(status: Status, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    start(async () => {
      const r = await setAppointmentStatus(a.id, status);
      if (!r.ok) toast.error("Falha", { description: r.error });
      else {
        const labels: Record<Status, string> = {
          pending: "Voltou para aguardando",
          confirmed: "Agendamento confirmado",
          cancelled: "Cancelado",
          completed: "Marcado como concluído",
          no_show: "Marcado como falta",
        };
        toast.success(labels[status]);
      }
    });
  }

  return (
    <li className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 text-sm">
      <div className="flex items-center gap-4 min-w-0">
        <span className="font-display text-xl text-accent tabular-nums w-16 shrink-0">
          {format(new Date(a.starts_at), "HH:mm")}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">
            {a.client_name}
          </p>
          <p className="text-xs text-muted">
            Com {a.barber_name ?? "—"} · {formatBRL(a.total_cents)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] border",
            STATUS_BG[a.status]
          )}
        >
          {a.status === "pending" && (
            <Loader2
              className={cn("h-3 w-3", pending ? "animate-spin" : "")}
              aria-hidden
            />
          )}
          {STATUS_LABEL[a.status]}
        </span>

        {/* Botões de ação */}
        {a.status === "pending" && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => run("confirmed")}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              ) : (
                <Check className="h-3 w-3" aria-hidden />
              )}
              Confirmar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => run("cancelled", "Recusar este agendamento?")}
              disabled={pending}
              className="text-danger hover:text-danger"
            >
              <X className="h-3 w-3" aria-hidden />
              Recusar
            </Button>
          </>
        )}

        {a.status === "confirmed" && past && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => run("completed")}
              disabled={pending}
            >
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Concluir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => run("no_show", "Cliente não compareceu?")}
              disabled={pending}
              className="text-muted hover:text-foreground"
            >
              <UserX className="h-3 w-3" aria-hidden />
              Faltou
            </Button>
          </>
        )}

        {a.status === "confirmed" && !past && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => run("cancelled", "Cancelar este agendamento?")}
            disabled={pending}
            className="text-danger hover:text-danger"
          >
            <X className="h-3 w-3" aria-hidden />
            Cancelar
          </Button>
        )}
      </div>
    </li>
  );
}
