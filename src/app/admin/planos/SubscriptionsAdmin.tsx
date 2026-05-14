"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  UserSearch,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { saveSubscription, deleteSubscription } from "@/app/admin/actions";
import type { Tables } from "@/lib/supabase/types";
import { formatBRL, cn } from "@/lib/utils";
import { PaymentsPanel } from "./PaymentsPanel";

type Subscription = Tables<"client_subscriptions">;
type Payment = Tables<"subscription_payments">;
type Profile = { id: string; full_name: string | null; phone: string | null };

type Row = Subscription & {
  profile: Pick<Profile, "full_name" | "phone"> | null;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  cancelled: "Cancelado",
};

const STATUS_BG: Record<string, string> = {
  active: "bg-success/15 text-success border-success/40",
  paused: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  cancelled: "bg-danger/15 text-danger border-danger/40",
};

export function SubscriptionsAdmin({
  subscriptions,
  clients,
  paymentsBySubId,
}: {
  subscriptions: Row[];
  clients: Profile[];
  paymentsBySubId: Record<string, Payment[]>;
}) {
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "cancelled">(
    "all"
  );

  const visible = useMemo(
    () =>
      filter === "all"
        ? subscriptions
        : subscriptions.filter((s) => s.status === filter),
    [subscriptions, filter]
  );

  const totalActive = subscriptions.filter((s) => s.status === "active").length;
  const totalRevenue = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.price_cents, 0);

  return (
    <div className="space-y-6">
      <section className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="py-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Mensalistas ativos
            </p>
            <p className="mt-1 font-display text-3xl text-foreground">
              {totalActive}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Receita recorrente / mês
            </p>
            <p className="mt-1 font-display text-3xl text-accent">
              {formatBRL(totalRevenue)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Total cadastrado
            </p>
            <p className="mt-1 font-display text-3xl text-foreground">
              {subscriptions.length}
            </p>
          </CardBody>
        </Card>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "active", "paused", "cancelled"] as const).map((f) => {
            const active = f === filter;
            const label =
              f === "all"
                ? "Todos"
                : f === "active"
                  ? "Ativos"
                  : f === "paused"
                    ? "Pausados"
                    : "Cancelados";
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-colors",
                  active
                    ? "bg-accent text-background border-accent"
                    : "border-border text-foreground/80 hover:border-accent/60 hover:text-accent"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" aria-hidden /> Novo mensalista
        </Button>
      </div>

      {editing && (
        <SubscriptionForm
          initial={editing === "new" ? null : editing}
          clients={clients}
          onClose={() => setEditing(null)}
        />
      )}

      {visible.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-muted">
            Nenhum mensalista nessa visualização.
          </CardBody>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((s) => {
            const isOpen = expanded === s.id;
            const payments = paymentsBySubId[s.id] ?? [];
            const totalPaid = payments.reduce(
              (sum, p) => sum + p.amount_cents,
              0
            );
            return (
              <li key={s.id}>
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4">
                    <div className="md:col-span-3">
                      <p className="font-medium">{s.profile?.full_name ?? "—"}</p>
                      <p className="text-xs text-muted">{s.profile?.phone ?? ""}</p>
                    </div>
                    <div className="md:col-span-2 text-sm">
                      <p className="text-foreground/85">{s.plan_name}</p>
                      <p className="text-xs text-muted">
                        Desde {format(new Date(`${s.started_at}T12:00:00`), "dd/MM/yy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="md:col-span-2 text-sm">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                        Valor / mês
                      </p>
                      <p className="font-display text-lg tabular-nums">
                        {formatBRL(s.price_cents)}
                      </p>
                    </div>
                    <div className="md:col-span-2 text-sm">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                        Recebido total
                      </p>
                      <p className="font-display text-lg text-accent tabular-nums">
                        {formatBRL(totalPaid)}
                      </p>
                      <p className="text-[10px] text-muted">
                        {payments.length} pagto{payments.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] border",
                          STATUS_BG[s.status]
                        )}
                      >
                        {STATUS_LABEL[s.status]}
                      </span>
                    </div>
                    <div className="md:col-span-1 flex md:justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpanded(isOpen ? null : s.id)
                        }
                        aria-expanded={isOpen}
                        aria-label="Ver pagamentos"
                      >
                        <Receipt className="h-4 w-4" aria-hidden />
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 transition-transform",
                            isOpen && "rotate-180"
                          )}
                          aria-hidden
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(s)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <DeleteButton id={s.id} />
                    </div>
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <PaymentsPanel
                        subscriptionId={s.id}
                        monthlyPriceCents={s.price_cents}
                        initialPayments={payments}
                      />
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remover este mensalista do cadastro?")) return;
        start(async () => {
          const r = await deleteSubscription(id);
          if (!r.ok) toast.error("Falha", { description: r.error });
          else toast.success("Removido.");
        });
      }}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Trash2 className="h-4 w-4 text-danger" aria-hidden />
      )}
    </Button>
  );
}

function SubscriptionForm({
  initial,
  clients,
  onClose,
}: {
  initial: Row | null;
  clients: Profile[];
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [profileId, setProfileId] = useState<string>(
    initial?.profile_id ?? ""
  );
  const [search, setSearch] = useState("");
  const [planName, setPlanName] = useState(initial?.plan_name ?? "");
  const [priceBrl, setPriceBrl] = useState<string>(
    initial ? (initial.price_cents / 100).toFixed(2) : ""
  );
  const [startedAt, setStartedAt] = useState(
    initial?.started_at ?? new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<Row["status"]>(
    initial?.status ?? "active"
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      (c.full_name ?? "").toLowerCase().includes(term)
    );
  }, [clients, search]);

  function submit() {
    if (!profileId) return toast.error("Escolha um cliente.");
    if (!planName.trim()) return toast.error("Informe o nome do plano.");
    const price = Math.round(parseFloat(priceBrl || "0") * 100);
    start(async () => {
      const r = await saveSubscription({
        id: initial?.id,
        profile_id: profileId,
        plan_name: planName.trim(),
        price_cents: price,
        started_at: startedAt,
        status,
        notes,
      });
      if (!r.ok) toast.error("Falha", { description: r.error });
      else {
        toast.success("Salvo.");
        onClose();
      }
    });
  }

  const selectedClient = clients.find((c) => c.id === profileId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initial ? "Editar mensalista" : "Novo mensalista"}
        </CardTitle>
      </CardHeader>
      <CardBody className="grid md:grid-cols-2 gap-4">
        {/* Selecionar cliente */}
        <div className="md:col-span-2">
          <Label htmlFor="client-search">Cliente</Label>
          {selectedClient ? (
            <div className="mt-1.5 flex items-center justify-between gap-3 p-3 rounded-[var(--radius)] border border-border bg-surface-2">
              <div>
                <p className="text-sm font-medium">
                  {selectedClient.full_name ?? "—"}
                </p>
                <p className="text-xs text-muted">
                  {selectedClient.phone ?? ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProfileId("")}
              >
                Trocar
              </Button>
            </div>
          ) : (
            <>
              <div className="relative mt-1.5">
                <UserSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                  aria-hidden
                />
                <Input
                  id="client-search"
                  placeholder="Buscar por nome…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-[var(--radius)] border border-border bg-surface-2 divide-y divide-border">
                {filteredClients.slice(0, 30).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileId(c.id);
                        setSearch("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors"
                    >
                      <p className="text-foreground">
                        {c.full_name ?? "(sem nome)"}
                      </p>
                      <p className="text-xs text-muted">{c.phone ?? ""}</p>
                    </button>
                  </li>
                ))}
                {filteredClients.length === 0 && (
                  <li className="px-3 py-2 text-xs text-muted">
                    Nenhum cliente bate com a busca.
                  </li>
                )}
              </ul>
            </>
          )}
        </div>

        <div>
          <Label htmlFor="plan_name">Nome do plano</Label>
          <Input
            id="plan_name"
            placeholder="Ex.: Corte ilimitado, Combo mensal"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="price_brl">Valor mensal (R$)</Label>
          <Input
            id="price_brl"
            type="number"
            step="0.01"
            min={0}
            value={priceBrl}
            onChange={(e) => setPriceBrl(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="started_at">Início</Label>
          <Input
            id="started_at"
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Row["status"])}
            className="mt-1.5 w-full h-11 rounded-[var(--radius)] bg-surface border border-border px-3 text-sm"
          >
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            rows={3}
            maxLength={500}
            placeholder="Forma de pagamento, condições, etc."
            value={notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius)] bg-surface border border-border px-4 py-2 text-sm focus-visible:border-accent focus-visible:outline-none"
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={pending} onClick={submit}>
            {pending && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            Salvar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
