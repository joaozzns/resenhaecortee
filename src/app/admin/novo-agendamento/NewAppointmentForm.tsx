"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardBody } from "@/components/ui/card";
import { createAdminAppointment } from "@/app/admin/actions";
import { formatBRL, formatDuration, cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  category: "cabelo" | "barba" | "combo" | "tratamento";
  duration_minutes: number;
  price_cents: number;
};

type Barber = {
  id: string;
  name: string;
};

export function NewAppointmentForm({
  services,
  barbers,
}: {
  services: Service[];
  barbers: Barber[];
}) {
  const router = useRouter();
  const [submitting, start] = useTransition();

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [barberId, setBarberId] = useState<string>(barbers[0]?.id ?? "");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [force, setForce] = useState(false);

  const selected = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)),
    [services, serviceIds]
  );
  const totalCents = selected.reduce((s, x) => s + x.price_cents, 0);
  const totalDuration = selected.reduce((s, x) => s + x.duration_minutes, 0);

  function toggleService(id: string) {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName || !clientPhone || !barberId || serviceIds.length === 0 || !date || !time) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    start(async () => {
      const r = await createAdminAppointment({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        barberId,
        serviceIds,
        date,
        time,
        notes,
        force,
      });
      if (!r.ok) {
        toast.error("Não criei", { description: r.error });
        return;
      }
      toast.success("Agendamento criado.");
      router.push("/admin/agendamentos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Cliente */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-muted">
            Cliente
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Celular *</Label>
              <Input
                id="phone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(31) 9 0000-0000"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input
              id="email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="opcional"
            />
          </div>
        </CardBody>
      </Card>

      {/* Barbeiro */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-muted">
            Barbeiro
          </h2>
          {barbers.length === 0 ? (
            <p className="text-sm text-danger">
              Nenhum barbeiro ativo. Cadastre um em /admin/barbeiros antes.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {barbers.map((b) => {
                const active = barberId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBarberId(b.id)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm transition-colors",
                      active
                        ? "bg-accent text-background border-accent"
                        : "border-border text-foreground/80 hover:border-accent"
                    )}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Serviços */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.18em] text-muted">
              Serviços *
            </h2>
            <p className="text-xs text-muted">
              {selected.length === 0
                ? "Nenhum selecionado"
                : `${selected.length} selecionado(s) · ${formatDuration(totalDuration)} · ${formatBRL(totalCents)}`}
            </p>
          </div>
          <ul className="grid md:grid-cols-2 gap-2">
            {services.map((s) => {
              const checked = serviceIds.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={cn(
                      "w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-md border text-sm transition-colors",
                      checked
                        ? "bg-accent-soft border-accent text-foreground"
                        : "border-border hover:border-accent/50"
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "grid place-items-center h-4 w-4 rounded-sm border shrink-0",
                          checked
                            ? "bg-accent text-background border-accent"
                            : "border-border-strong"
                        )}
                      >
                        {checked && <Check className="h-3 w-3" aria-hidden />}
                      </span>
                      <span className="truncate">{s.name}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted shrink-0">
                        <Clock className="h-3 w-3" aria-hidden />
                        {s.duration_minutes}m
                      </span>
                    </span>
                    <span className="font-medium tabular-nums shrink-0">
                      {formatBRL(s.price_cents)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      {/* Data e hora */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-muted">
            Quando *
          </h2>
          <p className="text-xs text-muted -mt-2">
            Horário em BRT (Brasília).
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Observações */}
      <Card>
        <CardBody className="space-y-2">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Algo que o barbeiro precise saber"
            className="w-full rounded-[var(--radius)] bg-surface border border-border px-4 py-3 text-sm focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none"
          />
        </CardBody>
      </Card>

      {/* Forçar conflito */}
      <label className="flex items-start gap-3 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={force}
          onChange={(e) => setForce(e.target.checked)}
          className="mt-1 h-4 w-4 accent-accent"
        />
        <span className="text-foreground/85">
          Forçar mesmo se já houver outro agendamento nesse horário com esse
          barbeiro
          <span className="block text-xs text-muted mt-0.5">
            Útil pra encaixe rápido. Use com cuidado.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" size="md" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Check className="h-4 w-4" aria-hidden />
          )}
          Criar agendamento
        </Button>
        <Button
          asChild
          type="button"
          variant="ghost"
          size="sm"
          disabled={submitting}
        >
          <a href="/admin/agendamentos">Cancelar</a>
        </Button>
      </div>
    </form>
  );
}
