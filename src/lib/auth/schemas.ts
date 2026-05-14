import { z } from "zod";

/**
 * Validações compartilhadas entre /entrar, /cadastrar e área do cliente.
 * Mantém mensagens em pt-BR e mesmo nível de exigência (ex.: 8 chars min).
 */

const passwordRule = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .max(72, "Máximo de 72 caracteres");

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z
    .string()
    .min(3, "Informe seu nome completo")
    .max(120, "Máximo de 120 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z
    .string()
    .min(14, "Telefone incompleto")
    .max(16, "Telefone inválido"),
  password: passwordRule,
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: "É preciso aceitar os termos",
  }),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const recoverSchema = z.object({
  email: z.string().email("E-mail inválido"),
});
export type RecoverInput = z.infer<typeof recoverSchema>;

export const magicLinkSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

/**
 * Aplica máscara BR de telefone celular: (XX) X XXXX-XXXX.
 * Aceita também fixo (10 dígitos) → (XX) XXXX-XXXX.
 * Idempotente: chamar de novo no resultado não desformata.
 */
export function maskPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // 11 dígitos — celular
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function unmaskPhone(masked: string): string {
  return masked.replace(/\D/g, "");
}

/**
 * Score de força de senha (0-4). Heurística simples: comprimento + variedade.
 * Não substitui zxcvbn, mas dá um sinal visual razoável.
 */
export function passwordStrength(pw: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["", "Fraca", "Razoável", "Boa", "Forte"];
  return { score: clamped, label: labels[clamped] };
}
