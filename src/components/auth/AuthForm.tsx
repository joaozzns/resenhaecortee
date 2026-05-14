"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "./PhoneInput";
import { PasswordStrength } from "./PasswordStrength";
import { GoogleIcon } from "./social-icons";
import { createClient } from "@/lib/supabase/client";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/auth/schemas";
import { cn } from "@/lib/utils";

type Variant = "login" | "signup";

/**
 * Formulário de autenticação unificado.
 *  - variant="login":  e-mail + senha + Google + magic link
 *  - variant="signup": nome + e-mail + telefone + senha + termos
 *
 * Usa o supabase-js no browser (anon key). Sessão é setada via cookies httpOnly
 * pelo proxy/middleware no próximo request, então fazemos router.refresh()
 * após o login para forçar o RSC a relê-la.
 */
export function AuthForm({ variant }: { variant: Variant }) {
  return variant === "login" ? <LoginForm /> : <SignupForm />;
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") ?? "/minha-conta";
  const [showPw, setShowPw] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = form;

  async function onSubmit(values: LoginInput) {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
      return;
    }
    toast.success("Bem-vindo de volta.");
    router.replace(redirect);
    router.refresh();
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      toast.error("Falha no login com Google", { description: error.message });
    }
  }

  async function handleMagicLink() {
    const email = getValues("email");
    if (!email || !email.includes("@")) {
      toast.error("Informe um e-mail válido para o link.");
      return;
    }
    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    setMagicLoading(false);
    if (error) {
      toast.error("Não enviei o link", { description: error.message });
      return;
    }
    toast.success("Link enviado", {
      description: "Confira sua caixa de entrada para entrar sem senha.",
    });
  }

  return (
    <div className="space-y-7">
      <Header
        eyebrow="Acesso"
        title="Bem-vindo de volta"
        sub="Entre para acompanhar seus agendamentos e seu histórico."
      />

      <Button
        type="button"
        variant="subtle"
        size="md"
        onClick={handleGoogle}
        className="w-full"
      >
        <GoogleIcon className="h-4 w-4" />
        Continuar com Google
      </Button>

      <Divider>ou com e-mail</Divider>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          id="email"
          label="E-mail"
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field
          id="password"
          label="Senha"
          error={errors.password?.message}
          right={
            <Link
              href="/recuperar-senha"
              className="text-xs text-accent hover:underline normal-case tracking-normal"
            >
              Esqueci a senha
            </Link>
          }
        >
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPw ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Entrar
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={handleMagicLink}
          disabled={magicLoading}
        >
          {magicLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Mail className="h-4 w-4" aria-hidden />
          )}
          Enviar link mágico para meu e-mail
        </Button>
      </form>

      <p className="text-sm text-muted text-center">
        Ainda não tem conta?{" "}
        <Link
          href={`/cadastrar${redirect !== "/minha-conta" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="text-accent hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") ?? "/minha-conta";
  const [showPw, setShowPw] = useState(false);
  const supabase = createClient();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      acceptTerms: false,
    },
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: SignupInput) {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // O trigger handle_new_user usa esses campos no raw_user_meta_data
        // para preencher profiles.full_name e profiles.phone.
        data: {
          full_name: values.fullName,
          phone: values.phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      toast.error("Não consegui criar sua conta", {
        description: error.message,
      });
      return;
    }
    // Quando confirmação de e-mail está ativa, session vem null
    if (!data.session) {
      toast.success("Conta criada", {
        description: "Enviamos um e-mail para você confirmar.",
      });
      router.replace("/entrar");
      return;
    }
    toast.success("Conta criada e você já está logado.");
    router.replace(redirect);
    router.refresh();
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error)
      toast.error("Falha no login com Google", { description: error.message });
  }

  return (
    <div className="space-y-7">
      <Header
        eyebrow="Cadastro"
        title="Crie sua conta"
        sub="Mais rapidez no agendamento, histórico e benefícios para clientes da casa."
      />

      <Button
        type="button"
        variant="subtle"
        size="md"
        onClick={handleGoogle}
        className="w-full"
      >
        <GoogleIcon className="h-4 w-4" />
        Continuar com Google
      </Button>

      <Divider>ou preencha os dados</Divider>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field id="fullName" label="Nome completo" error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Como devemos te chamar"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
        </Field>

        <Field id="email" label="E-mail" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field id="phone" label="Celular" error={errors.phone?.message}>
          <PhoneInput
            id="phone"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>

        <Field id="password" label="Senha" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPw ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
          <PasswordStrength value={password} />
        </Field>

        <label className="flex items-start gap-3 text-sm text-foreground/80 cursor-pointer">
          <input
            type="checkbox"
            {...register("acceptTerms")}
            className="mt-1 h-4 w-4 accent-accent rounded-sm border-border"
          />
          <span>
            Aceito os{" "}
            <Link href="/termos" className="text-accent hover:underline">
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="text-accent hover:underline">
              política de privacidade
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms && (
          <p className={cn("text-xs text-danger -mt-2")}>
            {errors.acceptTerms.message}
          </p>
        )}

        <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Criar conta
        </Button>
      </form>

      <p className="text-sm text-muted text-center">
        Já tem conta?{" "}
        <Link
          href={`/entrar${redirect !== "/minha-conta" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="text-accent hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Subcomponentes locais
// ----------------------------------------------------------------------------

function Header({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <header className="space-y-3">
      <span className="eyebrow flex items-center gap-3">
        <span className="gold-rule" /> {eyebrow}
      </span>
      <h1 className="text-3xl md:text-4xl font-display">{title}</h1>
      <p className="text-sm text-muted leading-relaxed">{sub}</p>
    </header>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted">
      <span className="flex-1 h-px bg-border" />
      {children}
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}

function Field({
  id,
  label,
  error,
  right,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <Label htmlFor={id}>{label}</Label>
        {right}
      </div>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
