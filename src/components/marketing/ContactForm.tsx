"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { siteConfig } from "@/lib/site";

const schema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(8, "Telefone incompleto").optional().or(z.literal("")),
  message: z.string().min(10, "Mensagem muito curta").max(2000),
});
type FormValues = z.infer<typeof schema>;

/**
 * Formulário de contato — gera um mailto: prefilled.
 * Quando RESEND_API_KEY estiver configurada, podemos trocar para uma
 * server action que envia direto. Por enquanto, mailto cobre o caso
 * sem infra adicional.
 */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  function onSubmit(v: FormValues) {
    const subject = `[Site] Contato de ${v.name}`;
    const body =
      `Nome: ${v.name}\n` +
      `E-mail: ${v.email}\n` +
      (v.phone ? `Telefone: ${v.phone}\n` : "") +
      `\nMensagem:\n${v.message}`;
    const url = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.assign(url);
    toast.success("Abrindo seu app de e-mail…");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Como devemos te chamar"
            aria-invalid={!!errors.name}
            className="mt-1.5"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Telefone (opcional)</Label>
          <PhoneInput
            id="phone"
            className="mt-1.5"
            {...register("phone")}
          />
        </div>
      </div>

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
          <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="message">Mensagem</Label>
        <textarea
          id="message"
          rows={5}
          placeholder="Conta como podemos ajudar."
          aria-invalid={!!errors.message}
          className={
            "mt-1.5 w-full rounded-[var(--radius)] bg-surface border border-border px-4 py-3 text-sm " +
            "text-foreground placeholder:text-muted/80 transition-colors duration-200 " +
            "hover:border-border-strong focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent " +
            "aria-invalid:border-danger"
          }
          {...register("message")}
        />
        {errors.message && (
          <p className="mt-1.5 text-xs text-danger">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" size="md" disabled={isSubmitting}>
        <Send className="h-4 w-4" aria-hidden />
        Enviar mensagem
      </Button>
    </form>
  );
}
