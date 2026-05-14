"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { updateMyProfile } from "@/app/minha-conta/actions";
import type { Tables } from "@/lib/supabase/types";

const schema = z.object({
  full_name: z.string().min(3, "Nome muito curto").max(120),
  phone: z.string().min(8, "Telefone incompleto"),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD").optional().or(z.literal("")),
  notification_email: z.boolean(),
  notification_whatsapp: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function ProfileForm({
  profile,
  email,
}: {
  profile: Tables<"profiles">;
  email: string;
}) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      birthdate: profile.birthdate ?? "",
      notification_email: profile.notification_email,
      notification_whatsapp: profile.notification_whatsapp,
    },
  });

  function onSubmit(v: FormValues) {
    startTransition(async () => {
      const r = await updateMyProfile(v);
      if (!r.ok) toast.error("Falha", { description: r.error });
      else toast.success("Perfil atualizado.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <div>
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              className="mt-1.5"
              {...register("full_name")}
              aria-invalid={!!errors.full_name}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="phone">Celular</Label>
              <PhoneInput
                id="phone"
                className="mt-1.5"
                {...register("phone")}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="birthdate">Data de aniversário</Label>
              <Input
                id="birthdate"
                type="date"
                className="mt-1.5"
                {...register("birthdate")}
                aria-invalid={!!errors.birthdate}
              />
              {errors.birthdate && (
                <p className="mt-1 text-xs text-danger">
                  {errors.birthdate.message}
                </p>
              )}
              <p className="mt-1 text-xs text-muted">
                Usamos para enviar um cupom no seu mês de aniversário.
              </p>
            </div>
          </div>

          <div>
            <Label>E-mail</Label>
            <Input
              value={email}
              disabled
              className="mt-1.5"
              readOnly
            />
            <p className="mt-1 text-xs text-muted">
              Para trocar o e-mail, fale com a gente em breve disponibilizamos
              o fluxo automático.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <Toggle
            label="E-mail"
            description="Confirmações, lembrete 24h antes e novidades."
            register={register("notification_email")}
          />
          <Toggle
            label="WhatsApp"
            description="Lembretes via WhatsApp."
            register={register("notification_whatsapp")}
          />
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="md"
          disabled={pending || !isDirty}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  description,
  register,
}: {
  label: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
      <span>
        <span className="block text-sm text-foreground">{label}</span>
        <span className="block text-xs text-muted mt-0.5">{description}</span>
      </span>
      <input
        type="checkbox"
        {...register}
        className="mt-1 h-4 w-4 accent-accent shrink-0"
      />
    </label>
  );
}
