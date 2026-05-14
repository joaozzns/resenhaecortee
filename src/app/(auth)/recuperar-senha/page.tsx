"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { recoverSchema, type RecoverInput } from "@/lib/auth/schemas";

function RecoverForm() {
  const [sent, setSent] = useState(false);
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoverInput>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RecoverInput) {
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/minha-conta/perfil`,
    });
    if (error) {
      toast.error("Falha ao enviar e-mail", { description: error.message });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center md:text-left">
        <div className="grid place-items-center md:place-items-start">
          <span className="grid place-items-center h-14 w-14 rounded-full bg-accent-soft text-accent">
            <MailCheck className="h-6 w-6" aria-hidden />
          </span>
        </div>
        <header className="space-y-3">
          <h1 className="text-3xl font-display">E-mail enviado</h1>
          <p className="text-sm text-muted leading-relaxed">
            Se houver uma conta cadastrada com esse e-mail, você receberá um
            link em alguns instantes para definir uma nova senha. Confira
            também a caixa de spam.
          </p>
        </header>
        <Button asChild variant="outline" size="md">
          <Link href="/entrar">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para entrar
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Esqueci a senha
        </span>
        <h1 className="text-3xl md:text-4xl font-display">
          Recuperar acesso
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          Informe o e-mail cadastrado. Enviaremos um link seguro para você
          definir uma nova senha.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            aria-invalid={!!errors.email}
            className="mt-1.5"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-danger" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Enviar link de recuperação
        </Button>
      </form>

      <p className="text-sm text-muted text-center">
        Lembrou a senha?{" "}
        <Link href="/entrar" className="text-accent hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </div>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <Suspense>
      <RecoverForm />
    </Suspense>
  );
}
