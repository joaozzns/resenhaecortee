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
import { saveBarber, deleteBarber } from "@/app/admin/actions";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Barber = Tables<"barbers">;

const formSchema = z.object({
  name: z.string().min(2),
  bio: z.string().optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
  specialties_csv: z.string().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  active: z.boolean(),
  sort_order: z.number().int(),
});
type FormValues = z.infer<typeof formSchema>;

export function BarbersAdmin({ barbers }: { barbers: Barber[] }) {
  const [editing, setEditing] = useState<Barber | "new" | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {barbers.length} barbeiro{barbers.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" aria-hidden /> Novo barbeiro
        </Button>
      </div>

      {editing && (
        <BarberForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border text-left text-muted">
            <tr>
              <th className="p-3 font-normal">Nome</th>
              <th className="p-3 font-normal">Especialidades</th>
              <th className="p-3 font-normal">Instagram</th>
              <th className="p-3 font-normal">Status</th>
              <th className="p-3 font-normal text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {barbers.map((b) => (
              <tr
                key={b.id}
                className={cn(
                  "border-b border-border last:border-0",
                  !b.active && "opacity-50"
                )}
              >
                <td className="p-3 font-medium">{b.name}</td>
                <td className="p-3 text-muted text-xs">
                  {b.specialties.join(", ") || "—"}
                </td>
                <td className="p-3 text-muted text-xs truncate max-w-[200px]">
                  {b.instagram ?? "—"}
                </td>
                <td className="p-3 text-xs">
                  {b.active ? "Ativo" : "Inativo"}
                </td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(b)}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <DeleteButton id={b.id} />
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
        if (!confirm("Desativar este barbeiro?")) return;
        start(async () => {
          const r = await deleteBarber(id);
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

function BarberForm({
  initial,
  onClose,
}: {
  initial: Barber | null;
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
      bio: initial?.bio ?? "",
      photo_url: initial?.photo_url ?? "",
      specialties_csv: initial?.specialties.join(", ") ?? "",
      instagram: initial?.instagram ?? "",
      active: initial?.active ?? true,
      sort_order: initial?.sort_order ?? 0,
    },
  });

  function onSubmit(v: FormValues) {
    const specialties = (v.specialties_csv ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    start(async () => {
      const r = await saveBarber({
        id: initial?.id,
        name: v.name,
        bio: v.bio,
        photo_url: v.photo_url,
        instagram: v.instagram,
        specialties,
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
        <CardTitle>{initial ? "Editar barbeiro" : "Novo barbeiro"}</CardTitle>
      </CardHeader>
      <CardBody>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid md:grid-cols-2 gap-4"
        >
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" className="mt-1.5" {...register("name")} />
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
          <div className="md:col-span-2">
            <Label htmlFor="bio">Biografia</Label>
            <textarea
              id="bio"
              rows={3}
              className="mt-1.5 w-full rounded-[var(--radius)] bg-surface border border-border px-4 py-2 text-sm focus-visible:border-accent focus-visible:outline-none"
              {...register("bio")}
            />
          </div>
          <div>
            <Label htmlFor="photo_url">URL da foto</Label>
            <Input id="photo_url" className="mt-1.5" {...register("photo_url")} />
          </div>
          <div>
            <Label htmlFor="instagram">Instagram (URL completa)</Label>
            <Input id="instagram" className="mt-1.5" {...register("instagram")} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="specialties_csv">
              Especialidades (separadas por vírgula)
            </Label>
            <Input
              id="specialties_csv"
              className="mt-1.5"
              placeholder="Ex.: Degradê, Barba à navalha, Cacheados"
              {...register("specialties_csv")}
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
