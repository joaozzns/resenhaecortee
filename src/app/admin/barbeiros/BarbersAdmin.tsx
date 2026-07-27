"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AtSign,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveBarber,
  setBarberActive,
  uploadBarberPhoto,
} from "@/app/admin/actions";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Barber = Tables<"barbers">;

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({
  name,
  photo,
  size = "md",
}: {
  name: string;
  photo: string | null;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "h-20 w-20 text-xl" : "h-12 w-12 text-sm";
  if (photo) {
    return (
      // Foto pode vir de host arbitrário (URL colada) — <img> evita a
      // allowlist do next/image no admin.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        className={cn(
          dim,
          "shrink-0 rounded-full object-cover border border-border bg-surface-2"
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        dim,
        "shrink-0 grid place-items-center rounded-full border border-border",
        "bg-surface-2 font-display font-semibold text-accent"
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Lista
// ----------------------------------------------------------------------------

export function BarbersAdmin({ barbers }: { barbers: Barber[] }) {
  const [editing, setEditing] = useState<Barber | "new" | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return barbers;
    return barbers.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.specialties.some((s) => s.toLowerCase().includes(q))
    );
  }, [barbers, query]);

  const activeCount = barbers.filter((b) => b.active).length;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar barbeiro…"
              className="pl-9 w-full sm:w-64"
              aria-label="Buscar barbeiro"
            />
          </div>
          <p className="hidden sm:block text-xs text-muted whitespace-nowrap">
            {activeCount} ativo{activeCount === 1 ? "" : "s"} ·{" "}
            {barbers.length} no total
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" aria-hidden /> Novo barbeiro
        </Button>
      </div>

      {/* Grid de cards */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface/50 p-12 text-center">
          <UserRound className="mx-auto h-8 w-8 text-muted" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            {query
              ? "Nenhum barbeiro corresponde à busca."
              : "Nenhum barbeiro cadastrado ainda."}
          </p>
          {!query && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => setEditing("new")}
            >
              <Plus className="h-4 w-4" aria-hidden /> Cadastrar o primeiro
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => (
            <BarberCard key={b.id} barber={b} onEdit={() => setEditing(b)} />
          ))}
        </div>
      )}

      {editing && (
        <BarberFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function BarberCard({
  barber,
  onEdit,
}: {
  barber: Barber;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggleActive() {
    if (barber.active && !confirm(`Desativar ${barber.name}? Deixará de aparecer no agendamento.`))
      return;
    start(async () => {
      const r = await setBarberActive(barber.id, !barber.active);
      if (!r.ok) toast.error("Falha", { description: r.error });
      else {
        toast.success(barber.active ? "Barbeiro desativado." : "Barbeiro ativado.");
        router.refresh();
      }
    });
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-colors",
        "hover:border-border-strong",
        !barber.active && "opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar name={barber.name} photo={barber.photo_url} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg leading-tight">
              {barber.name}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                barber.active
                  ? "bg-accent-soft text-accent"
                  : "bg-surface-2 text-muted"
              )}
            >
              {barber.active ? "Ativo" : "Inativo"}
            </span>
          </div>
          {barber.instagram && (
            <a
              href={barber.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
            >
              <AtSign className="h-3 w-3" aria-hidden /> Instagram
            </a>
          )}
          {barber.bio && (
            <p className="mt-2 text-xs text-muted line-clamp-2">{barber.bio}</p>
          )}
        </div>
      </div>

      {barber.specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {barber.specialties.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-foreground/80"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="text-[11px] text-muted">Ordem {barber.sort_order}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" aria-hidden /> Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={toggleActive}
            aria-label={barber.active ? "Desativar" : "Ativar"}
            title={barber.active ? "Desativar" : "Ativar"}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : barber.active ? (
              <Trash2 className="h-4 w-4 text-danger" aria-hidden />
            ) : (
              <Plus className="h-4 w-4 text-accent" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Modal + formulário
// ----------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(2, "Informe ao menos 2 caracteres."),
  bio: z.string().max(1000, "Máx. 1000 caracteres.").optional().or(z.literal("")),
  instagram: z
    .string()
    .url("Cole a URL completa (https://…).")
    .optional()
    .or(z.literal("")),
  sort_order: z.coerce
    .number()
    .int("Número inteiro.")
    .min(0, "Deve ser ≥ 0.")
    .max(999, "Valor muito alto."),
});
type FormValues = z.input<typeof formSchema>;

function BarberFormModal({
  initial,
  onClose,
}: {
  initial: Barber | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url ?? "");
  const [specialties, setSpecialties] = useState<string[]>(
    initial?.specialties ?? []
  );
  const [active, setActive] = useState(initial?.active ?? true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name ?? "",
      bio: initial?.bio ?? "",
      instagram: initial?.instagram ?? "",
      sort_order: initial?.sort_order ?? 0,
    },
  });

  // Fecha no Escape + trava o scroll do body enquanto aberto.
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

  function onValid(v: FormValues) {
    start(async () => {
      const r = await saveBarber({
        id: initial?.id,
        name: v.name,
        bio: v.bio,
        photo_url: photoUrl,
        instagram: v.instagram,
        specialties,
        active,
        sort_order: Number(v.sort_order),
      });
      if (!r.ok) {
        toast.error("Não foi possível salvar", { description: r.error });
        return;
      }
      toast.success(initial ? "Barbeiro atualizado." : "Barbeiro criado.");
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Editar barbeiro" : "Novo barbeiro"}
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-4 backdrop-blur">
          <h2 className="font-display text-lg font-semibold">
            {initial ? "Editar barbeiro" : "Novo barbeiro"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onValid)} className="space-y-6 p-6">
          {/* Foto */}
          <PhotoUploader
            name={initial?.name ?? "Novo barbeiro"}
            value={photoUrl}
            onChange={setPhotoUrl}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nome" error={errors.name?.message} htmlFor="name">
              <Input
                id="name"
                autoFocus
                aria-invalid={!!errors.name}
                {...register("name")}
              />
            </Field>
            <Field
              label="Ordem de exibição"
              error={errors.sort_order?.message}
              htmlFor="sort_order"
              hint="Menor aparece primeiro."
            >
              <Input
                id="sort_order"
                type="number"
                min={0}
                aria-invalid={!!errors.sort_order}
                {...register("sort_order")}
              />
            </Field>
          </div>

          <Field label="Biografia" error={errors.bio?.message} htmlFor="bio">
            <textarea
              id="bio"
              rows={3}
              className="w-full rounded-[var(--radius)] border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/80 transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              placeholder="Uma frase curta que aparece no site."
              {...register("bio")}
            />
          </Field>

          <Field
            label="Instagram"
            error={errors.instagram?.message}
            htmlFor="instagram"
            hint="URL completa, ex.: https://instagram.com/usuario"
          >
            <Input
              id="instagram"
              inputMode="url"
              placeholder="https://instagram.com/…"
              aria-invalid={!!errors.instagram}
              {...register("instagram")}
            />
          </Field>

          <div>
            <Label className="mb-1.5 block">Especialidades</Label>
            <TagInput value={specialties} onChange={setSpecialties} />
          </div>

          {/* Ativo */}
          <label className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-surface-2/50 px-4 py-3">
            <span className="text-sm">
              <span className="font-medium">Ativo</span>
              <span className="block text-xs text-muted">
                Barbeiros ativos aparecem no agendamento.
              </span>
            </span>
            <Switch checked={active} onChange={setActive} label="Ativo" />
          </label>

          <div className="flex justify-end gap-2 border-t border-border pt-5">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {initial ? "Salvar alterações" : "Criar barbeiro"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Subcomponentes
// ----------------------------------------------------------------------------

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function PhotoUploader({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Formato inválido", {
        description: "Use PNG, JPG, WEBP ou AVIF.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Imagem muito grande", { description: "Máximo de 5 MB." });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const r = await uploadBarberPhoto(fd);
      if (!r.ok) toast.error("Falha no upload", { description: r.error });
      else {
        onChange(r.url);
        toast.success("Foto enviada.");
      }
    } catch {
      toast.error("Falha no upload", { description: "Tente novamente." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Avatar name={name} photo={value || null} size="lg" />

      <div
        className={cn(
          "flex-1 rounded-[var(--radius)] border border-dashed p-4 transition-colors",
          dragOver ? "border-accent bg-accent-soft/40" : "border-border"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : value ? (
              <ImagePlus className="h-4 w-4" aria-hidden />
            ) : (
              <UploadCloud className="h-4 w-4" aria-hidden />
            )}
            {uploading ? "Enviando…" : value ? "Trocar foto" : "Enviar foto"}
          </Button>
          {value && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
            >
              <Trash2 className="h-4 w-4 text-danger" aria-hidden /> Remover
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          Arraste uma imagem aqui ou clique em enviar. PNG, JPG ou WEBP até 5 MB.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim().replace(/,$/, "").trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-colors">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 py-1 pl-2.5 pr-1 text-xs text-foreground/90"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((x) => x !== tag))}
            className="grid h-4 w-4 place-items-center rounded-full text-muted hover:bg-danger/15 hover:text-danger transition-colors"
            aria-label={`Remover ${tag}`}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length === 0 ? "Ex.: Degradê, Barba, Cacheados…" : ""}
        className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-muted/80 focus:outline-none"
        aria-label="Adicionar especialidade"
      />
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        checked ? "bg-accent" : "bg-surface-2 border border-border"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
