"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, UserCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import type { Service, Barber, BookingState } from "@/lib/booking/types";
import type { CurrentUser } from "@/lib/auth/helpers";
import { formatBRL, formatDuration } from "@/lib/utils";
import { fmtBRT } from "@/lib/date";

const guestSchema = z
  .object({
    name: z.string().min(3, "Nome muito curto").max(120),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(14, "Telefone incompleto").max(16),
    notes: z.string().max(500).optional(),
    createAccount: z.boolean(),
    password: z.string().optional(),
    acceptTerms: z.boolean().refine((v) => v === true, "Aceite os termos"),
  })
  .superRefine((v, ctx) => {
    if (v.createAccount && (!v.password || v.password.length < 8)) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Senha mínima de 8 caracteres",
      });
    }
  });

const loggedSchema = z.object({
  name: z.string().min(3).max(120),
  email: z.string().email(),
  phone: z.string().min(14),
  notes: z.string().max(500).optional(),
  acceptTerms: z.boolean().refine((v) => v === true, "Aceite os termos"),
});

type GuestForm = z.infer<typeof guestSchema>;
type LoggedForm = z.infer<typeof loggedSchema>;

export function ConfirmStep({
  state,
  services,
  barbers,
  user,
  onSuccess,
}: {
  state: BookingState;
  services: Service[];
  barbers: Barber[];
  user: CurrentUser | null;
  onSuccess: (id: string, cancelToken: string) => void;
}) {
  const router = useRouter();
  const isLogged = !!user;

  const selectedServices = services.filter((s) =>
    state.serviceIds.includes(s.id)
  );
  const totalCents = selectedServices.reduce((s, x) => s + x.price_cents, 0);
  const totalDuration = selectedServices.reduce(
    (s, x) => s + x.duration_minutes,
    0
  );
  const barber =
    state.barberId && state.barberId !== "any"
      ? barbers.find((b) => b.id === state.barberId)
      : null;
  const startsAtDate = state.startsAtUtc ? new Date(state.startsAtUtc) : null;

  const guestForm = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      createAccount: true,
      password: "",
      acceptTerms: false,
    },
  });

  const loggedForm = useForm<LoggedForm>({
    resolver: zodResolver(loggedSchema),
    defaultValues: {
      name: user?.profile?.full_name ?? "",
      email: user?.email ?? "",
      phone: user?.profile?.phone ?? "",
      notes: "",
      acceptTerms: false,
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(values: GuestForm | LoggedForm) {
    if (!state.startsAtUtc) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = {
        serviceIds: state.serviceIds,
        barberId: state.barberId,
        startsAtUtc: state.startsAtUtc,
        client: {
          name: values.name,
          email: values.email,
          phone: values.phone,
        },
        notes: values.notes || undefined,
        ...(isLogged
          ? {}
          : {
              createAccount: (values as GuestForm).createAccount,
              password: (values as GuestForm).password,
            }),
        acceptTerms: values.acceptTerms,
      };
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const msg =
          json?.error ??
          json?.issues?.formErrors?.[0] ??
          `Falha (HTTP ${res.status})`;
        throw new Error(msg);
      }
      toast.success("Agendamento confirmado.");
      onSuccess(json.appointment.id, json.appointment.cancelToken);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro inesperado.";
      setSubmitError(msg);
      toast.error("Não consegui agendar", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Passo 4
        </span>
        <h2 className="text-3xl md:text-4xl font-display">
          Última conferida e tá feito.
        </h2>
        <p className="text-foreground/70 text-sm md:text-base leading-relaxed max-w-2xl">
          Revise os dados e confirme. A confirmação é imediata.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Resumo (sticky no desktop) */}
        <aside className="lg:col-span-5 lg:order-2">
          <div className="lg:sticky lg:top-28 rounded-[var(--radius-lg)] border border-border bg-surface p-6 space-y-5">
            <h3 className="font-display text-xl">Resumo</h3>

            <ul className="space-y-3">
              {selectedServices.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span className="text-foreground/85">{s.name}</span>
                  <span className="text-muted tabular-nums">
                    {formatBRL(s.price_cents)}
                  </span>
                </li>
              ))}
            </ul>

            <hr className="border-border" />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Duração</dt>
                <dd>{formatDuration(totalDuration)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Barbeiro</dt>
                <dd>{barber ? barber.name : "Sem preferência"}</dd>
              </div>
              {startsAtDate && (
                <div className="flex justify-between">
                  <dt className="text-muted">Quando</dt>
                  <dd className="text-right">
                    {fmtBRT(startsAtDate, "dd 'de' MMM, EEEE")}
                    <span className="block text-accent">
                      {fmtBRT(startsAtDate, "HH:mm")} BRT
                    </span>
                  </dd>
                </div>
              )}
            </dl>

            <hr className="border-border" />
            <div className="flex justify-between items-baseline">
              <span className="text-muted text-sm">Total</span>
              <span className="font-display text-3xl text-foreground">
                {formatBRL(totalCents)}
              </span>
            </div>
          </div>
        </aside>

        {/* Formulário */}
        <div className="lg:col-span-7 lg:order-1">
          {isLogged ? (
            <LoggedFlow
              form={loggedForm}
              onSubmit={submit}
              submitting={submitting}
              user={user}
            />
          ) : (
            <GuestFlow
              form={guestForm}
              onSubmit={submit}
              submitting={submitting}
              redirectFromConfirm={() => {
                if (typeof window !== "undefined") {
                  router.push(
                    `/entrar?redirect=${encodeURIComponent(
                      window.location.pathname + window.location.search
                    )}`
                  );
                }
              }}
            />
          )}

          {submitError && (
            <p className="mt-4 flex items-start gap-2 text-sm text-danger">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
              {submitError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub: usuário logado
// ============================================================================

function LoggedFlow({
  form,
  onSubmit,
  submitting,
  user,
}: {
  form: ReturnType<typeof useForm<LoggedForm>>;
  onSubmit: (v: LoggedForm) => void;
  submitting: boolean;
  user: CurrentUser;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="rounded-[var(--radius-lg)] border border-border bg-accent-soft/30 p-4 flex items-center gap-3">
        <UserCircle2 className="h-6 w-6 text-accent shrink-0" aria-hidden />
        <div className="flex-1 text-sm">
          Agendando como{" "}
          <strong className="text-foreground">
            {user.profile?.full_name ?? user.email}
          </strong>
          .{" "}
          <Link
            href="/auth/signout"
            className="text-accent hover:underline"
          >
            não é você?
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field id="name" label="Nome" error={errors.name?.message}>
          <Input id="name" {...register("name")} />
        </Field>
        <Field id="phone" label="Celular" error={errors.phone?.message}>
          <PhoneInput id="phone" {...register("phone")} />
        </Field>
      </div>
      <Field id="email" label="E-mail" error={errors.email?.message}>
        <Input id="email" type="email" {...register("email")} />
      </Field>

      <Field id="notes" label="Observações (opcional)" error={errors.notes?.message}>
        <textarea
          id="notes"
          rows={3}
          maxLength={500}
          placeholder="Algo que o barbeiro precise saber"
          className="w-full rounded-[var(--radius)] bg-surface border border-border px-4 py-3 text-sm focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none"
          {...register("notes")}
        />
      </Field>

      <Terms register={register} error={errors.acceptTerms?.message} />

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        )}
        Confirmar agendamento
      </Button>
    </form>
  );
}

// ============================================================================
// Sub: guest
// ============================================================================

function GuestFlow({
  form,
  onSubmit,
  submitting,
  redirectFromConfirm,
}: {
  form: ReturnType<typeof useForm<GuestForm>>;
  onSubmit: (v: GuestForm) => void;
  submitting: boolean;
  redirectFromConfirm: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;
  const createAccount = watch("createAccount");
  const password = watch("password") ?? "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-foreground/80">Já tem conta?</span>
        <button
          type="button"
          onClick={redirectFromConfirm}
          className="text-accent hover:underline"
        >
          Entrar para agendar mais rápido
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field id="name" label="Nome" error={errors.name?.message}>
          <Input
            id="name"
            placeholder="Como devemos te chamar"
            {...register("name")}
          />
        </Field>
        <Field id="phone" label="Celular" error={errors.phone?.message}>
          <PhoneInput id="phone" {...register("phone")} />
        </Field>
      </div>

      <Field id="email" label="E-mail" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...register("email")}
        />
      </Field>

      <Field id="notes" label="Observações (opcional)" error={errors.notes?.message}>
        <textarea
          id="notes"
          rows={3}
          maxLength={500}
          className="w-full rounded-[var(--radius)] bg-surface border border-border px-4 py-3 text-sm focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none"
          {...register("notes")}
        />
      </Field>

      <label className="flex items-start gap-3 text-sm cursor-pointer">
        <input
          type="checkbox"
          {...register("createAccount")}
          className="mt-1 h-4 w-4 accent-accent"
        />
        <span className="text-foreground/85">
          Criar uma conta para acompanhar meus agendamentos.
          <span className="block text-xs text-muted mt-0.5">
            Recomendado — fica mais fácil reagendar e consultar histórico.
          </span>
        </span>
      </label>

      {createAccount && (
        <Field id="password" label="Senha" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            {...register("password")}
          />
          <PasswordStrength value={password} />
        </Field>
      )}

      <Terms register={register} error={errors.acceptTerms?.message} />

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        )}
        Confirmar agendamento
      </Button>
    </form>
  );
}

// ============================================================================
// Sub-helpers
// ============================================================================

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Terms({ register, error }: { register: any; error?: string }) {
  return (
    <div>
      <label className="flex items-start gap-3 text-sm cursor-pointer">
        <input
          type="checkbox"
          {...register("acceptTerms")}
          className="mt-1 h-4 w-4 accent-accent"
        />
        <span className="text-foreground/85">
          Aceito os{" "}
          <Link href="/termos" className="text-accent hover:underline">
            termos
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="text-accent hover:underline">
            política de privacidade
          </Link>
          .
        </span>
      </label>
      {error && (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
