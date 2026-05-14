"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { saveService, deleteService } from "@/app/admin/actions";
import type { Tables } from "@/lib/supabase/types";
import { formatBRL, cn } from "@/lib/utils";

type Service = Tables<"services">;

const formSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  category: z.enum(["cabelo", "barba", "combo", "tratamento"]),
  duration_minutes: z
    .number({ message: "Informe a duração" })
    .int()
    .min(15)
    .refine((n) => n % 15 === 0, "Múltiplo de 15"),
  price_brl: z.number({ message: "Informe o preço" }).min(0),
  active: z.boolean(),
  sort_order: z.number().int(),
});
type FormValues = z.infer<typeof formSchema>;

export function ServicesAdmin({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {services.length} serviço{services.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" aria-hidden /> Novo serviço
        </Button>
      </div>

      {editing && (
        <ServiceForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border text-left text-muted">
            <tr>
              <th className="p-3 font-normal">Nome</th>
              <th className="p-3 font-normal">Categoria</th>
              <th className="p-3 font-normal text-right">Duração</th>
              <th className="p-3 font-normal text-right">Preço</th>
              <th className="p-3 font-normal">Status</th>
              <th className="p-3 font-normal text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr
                key={s.id}
                className={cn(
                  "border-b border-border last:border-0",
                  !s.active && "opacity-50"
                )}
              >
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3 text-muted">{s.category}</td>
                <td className="p-3 text-right tabular-nums">
                  {s.duration_minutes} min
                </td>
                <td className="p-3 text-right tabular-nums">
                  {formatBRL(s.price_cents)}
                </td>
                <td className="p-3 text-xs">
                  {s.active ? "Ativo" : "Inativo"}
                </td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(s)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <DeleteButton id={s.id} />
                  </div>
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
        if (!confirm("Desativar este serviço? Histórico é preservado.")) return;
        start(async () => {
          const r = await deleteService(id);
          if (!r.ok) toast.error("Falha", { description: r.error });
          else toast.success("Desativado.");
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

function ServiceForm({
  initial,
  onClose,
}: {
  initial: Service | null;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      category: (initial?.category as FormValues["category"]) ?? "cabelo",
      duration_minutes: initial?.duration_minutes ?? 30,
      price_brl: initial ? initial.price_cents / 100 : 0,
      active: initial?.active ?? true,
      sort_order: initial?.sort_order ?? 0,
    },
  });

  function onSubmit(v: FormValues) {
    start(async () => {
      const r = await saveService({
        id: initial?.id,
        name: v.name,
        description: v.description,
        category: v.category,
        duration_minutes: v.duration_minutes,
        price_cents: Math.round(v.price_brl * 100),
        active: v.active,
        sort_order: v.sort_order,
      });
      if (!r.ok) toast.error("Falha", { description: r.error });
      else {
        toast.success("Salvo.");
        onClose();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? "Editar serviço" : "Novo serviço"}</CardTitle>
      </CardHeader>
      <CardBody>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" className="mt-1.5" {...register("name")} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              rows={3}
              className="mt-1.5 w-full rounded-[var(--radius)] bg-surface border border-border px-4 py-2 text-sm focus-visible:border-accent focus-visible:outline-none"
              {...register("description")}
            />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              className="mt-1.5 w-full h-11 rounded-[var(--radius)] bg-surface border border-border px-3 text-sm"
              {...register("category")}
            >
              <option value="cabelo">Cabelo</option>
              <option value="barba">Barba</option>
              <option value="combo">Combo</option>
              <option value="tratamento">Tratamento</option>
            </select>
          </div>
          <div>
            <Label htmlFor="duration_minutes">Duração (min, múltiplo de 15)</Label>
            <Input
              id="duration_minutes"
              type="number"
              min={15}
              step={15}
              className="mt-1.5"
              {...register("duration_minutes", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label htmlFor="price_brl">Preço (R$)</Label>
            <Input
              id="price_brl"
              type="number"
              step="0.01"
              min={0}
              className="mt-1.5"
              {...register("price_brl", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label htmlFor="sort_order">Ordem</Label>
            <Input
              id="sort_order"
              type="number"
              className="mt-1.5"
              {...register("sort_order", { valueAsNumber: true })}
            />
          </div>
          <label className="md:col-span-2 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("active")} className="accent-accent" />
            Ativo
          </label>
          {Object.keys(errors).length > 0 && (
            <p className="md:col-span-2 text-xs text-danger">
              Corrija os campos destacados.
            </p>
          )}
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Salvar
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
