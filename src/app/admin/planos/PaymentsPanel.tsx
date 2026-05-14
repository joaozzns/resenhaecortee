"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePayment, deletePayment } from "@/app/admin/actions";
import type { Tables } from "@/lib/supabase/types";
import { formatBRL } from "@/lib/utils";

type Payment = Tables<"subscription_payments">;

const METHODS = ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Transferência"];

/**
 * Painel inline de histórico de pagamentos para uma assinatura.
 *  - Lista pagamentos (data DESC)
 *  - Soma total recebido
 *  - Form rápido para registrar novo pagamento
 *  - Excluir pagamento individual
 */
export function PaymentsPanel({
  subscriptionId,
  monthlyPriceCents,
  initialPayments,
}: {
  subscriptionId: string;
  monthlyPriceCents: number;
  initialPayments: Payment[];
}) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [showForm, setShowForm] = useState(false);

  const total = payments.reduce((s, p) => s + p.amount_cents, 0);

  return (
    <div className="space-y-4 p-4 bg-surface-2/40 rounded-[var(--radius)] border border-border">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Histórico de pagamentos
          </p>
          <p className="text-sm text-foreground/80 mt-1">
            <span className="font-medium">{payments.length}</span>{" "}
            pagamento{payments.length === 1 ? "" : "s"} · Total recebido{" "}
            <span className="font-display text-accent">{formatBRL(total)}</span>
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3 w-3" aria-hidden /> Registrar pagamento
          </Button>
        )}
      </div>

      {showForm && (
        <PaymentForm
          subscriptionId={subscriptionId}
          defaultAmount={monthlyPriceCents}
          onCancel={() => setShowForm(false)}
          onCreated={(p) => {
            setPayments((prev) => [p, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {payments.length === 0 ? (
        <p className="text-xs text-muted py-2">
          Nenhum pagamento registrado para essa assinatura.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {payments.map((p) => (
            <PaymentRow
              key={p.id}
              p={p}
              onDeleted={() =>
                setPayments((prev) => prev.filter((x) => x.id !== p.id))
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PaymentRow({
  p,
  onDeleted,
}: {
  p: Payment;
  onDeleted: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-muted tabular-nums w-24">
          {format(new Date(`${p.paid_at}T12:00:00`), "dd 'de' MMM yyyy", {
            locale: ptBR,
          })}
        </span>
        <span className="font-display text-base text-accent tabular-nums">
          {formatBRL(p.amount_cents)}
        </span>
        {p.method && (
          <span className="text-xs text-foreground/70 px-2 py-0.5 rounded-full border border-border">
            {p.method}
          </span>
        )}
        {p.notes && (
          <span className="text-xs text-muted truncate max-w-[200px]">
            {p.notes}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("Remover este pagamento?")) return;
          start(async () => {
            const r = await deletePayment(p.id);
            if (!r.ok) toast.error("Falha", { description: r.error });
            else {
              toast.success("Removido.");
              onDeleted();
            }
          });
        }}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="h-3 w-3 text-danger" aria-hidden />
        )}
      </Button>
    </li>
  );
}

function PaymentForm({
  subscriptionId,
  defaultAmount,
  onCancel,
  onCreated,
}: {
  subscriptionId: string;
  defaultAmount: number;
  onCancel: () => void;
  onCreated: (p: Payment) => void;
}) {
  const [amount, setAmount] = useState((defaultAmount / 100).toFixed(2));
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("Pix");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const cents = Math.round(parseFloat(amount || "0") * 100);
    if (cents <= 0) return toast.error("Informe um valor.");
    start(async () => {
      const r = await savePayment({
        subscription_id: subscriptionId,
        amount_cents: cents,
        paid_at: paidAt,
        method,
        notes,
      });
      if (!r.ok) {
        toast.error("Falha", { description: r.error });
        return;
      }
      toast.success("Pagamento registrado.");
      // Otimista: cria um placeholder; em re-fetch a página atualiza.
      onCreated({
        id: crypto.randomUUID(),
        subscription_id: subscriptionId,
        amount_cents: cents,
        paid_at: paidAt,
        method,
        notes,
        created_at: new Date().toISOString(),
      });
    });
  }

  return (
    <div className="p-4 rounded-[var(--radius)] border border-border bg-surface space-y-4">
      <p className="text-xs uppercase tracking-[0.18em] text-accent">
        Novo pagamento
      </p>
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <Label htmlFor="pay-amount">Valor (R$)</Label>
          <Input
            id="pay-amount"
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="pay-date">Data</Label>
          <Input
            id="pay-date"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="pay-method">Forma</Label>
          <select
            id="pay-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1.5 w-full h-11 rounded-[var(--radius)] bg-surface-2 border border-border px-3 text-sm"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="pay-notes">Obs (opcional)</Label>
          <Input
            id="pay-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nº comprovante…"
            className="mt-1.5"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar pagamento
        </Button>
      </div>
    </div>
  );
}
