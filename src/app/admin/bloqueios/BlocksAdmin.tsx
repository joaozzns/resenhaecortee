"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fromZonedTime } from "date-fns-tz";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { saveBlock, deleteBlock } from "@/app/admin/actions";
import type { Tables } from "@/lib/supabase/types";

type Block = Tables<"time_blocks">;
type Barber = Tables<"barbers">;

const TZ = "America/Sao_Paulo";

export function BlocksAdmin({
  blocks,
  barbers,
}: {
  blocks: Array<Block & { barber: { name: string } | null }>;
  barbers: Barber[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {blocks.length} bloqueio{blocks.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden /> Novo bloqueio
        </Button>
      </div>

      {open && <BlockForm barbers={barbers} onClose={() => setOpen(false)} />}

      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border text-left text-muted">
            <tr>
              <th className="p-3 font-normal">Barbeiro</th>
              <th className="p-3 font-normal">Início</th>
              <th className="p-3 font-normal">Fim</th>
              <th className="p-3 font-normal">Motivo</th>
              <th className="p-3 font-normal text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {blocks.length === 0 && (
              <tr>
                <td className="p-6 text-muted text-center" colSpan={5}>
                  Nenhum bloqueio ativo.
                </td>
              </tr>
            )}
            {blocks.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="p-3">{b.barber?.name ?? "—"}</td>
                <td className="p-3 tabular-nums">
                  {format(new Date(b.starts_at), "dd/MM HH:mm", { locale: ptBR })}
                </td>
                <td className="p-3 tabular-nums">
                  {format(new Date(b.ends_at), "dd/MM HH:mm", { locale: ptBR })}
                </td>
                <td className="p-3 text-muted">{b.reason ?? "—"}</td>
                <td className="p-3 text-right">
                  <DeleteButton id={b.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
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
        if (!confirm("Remover bloqueio?")) return;
        start(async () => {
          const r = await deleteBlock(id);
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

function BlockForm({
  barbers,
  onClose,
}: {
  barbers: Barber[];
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [barberId, setBarberId] = useState(barbers[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("");

  function submit() {
    if (!barberId || !date) return toast.error("Preencha barbeiro e data.");
    // Constrói ISO em UTC a partir do horário local BR
    const startIso = fromZonedTime(`${date}T${startTime}:00`, TZ).toISOString();
    const endIso = fromZonedTime(`${date}T${endTime}:00`, TZ).toISOString();
    start(async () => {
      const r = await saveBlock({
        barber_id: barberId,
        starts_at: startIso,
        ends_at: endIso,
        reason,
      });
      if (!r.ok) toast.error("Falha", { description: r.error });
      else {
        toast.success("Bloqueio criado.");
        onClose();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo bloqueio</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="barber">Barbeiro</Label>
            <select
              id="barber"
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              className="mt-1.5 w-full h-11 rounded-[var(--radius)] bg-surface border border-border px-3 text-sm"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              className="mt-1.5"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="startTime">Início</Label>
            <Input
              id="startTime"
              type="time"
              step={1800}
              className="mt-1.5"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endTime">Fim</Label>
            <Input
              id="endTime"
              type="time"
              step={1800}
              className="mt-1.5"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input
              id="reason"
              className="mt-1.5"
              placeholder="Almoço, folga, médico…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" size="sm" disabled={pending} onClick={submit}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Salvar
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
