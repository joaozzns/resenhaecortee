"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/auth/schemas";

/**
 * Cria a conta já com e-mail confirmado (sem etapa de confirmação por e-mail).
 * Substitui o supabase.auth.signUp do cliente para evitar que o usuário fique
 * preso esperando um e-mail de confirmação que muitas vezes não chega.
 *
 * O trigger handle_new_user usa user_metadata (full_name, phone) para popular
 * public.profiles. Depois o cliente faz signInWithPassword normalmente.
 */
export async function signUpConfirmed(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string; alreadyExists?: boolean }> {
  const parsed = signupSchema.safeParse({ ...input, acceptTerms: true });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, phone: input.phone },
  });

  if (error) {
    const code = (error as { code?: string }).code;
    const alreadyExists =
      code === "email_exists" ||
      /already been registered|already registered|exists/i.test(error.message);
    return {
      ok: false,
      alreadyExists,
      error: alreadyExists
        ? "Este e-mail já tem conta. Faça login."
        : error.message,
    };
  }

  return { ok: true };
}
