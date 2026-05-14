import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables, UserRole } from "@/lib/supabase/types";

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: Tables<"profiles"> | null;
};

/**
 * Lê o usuário autenticado e o profile (lazy-load: 1 query se logado, 0 se não).
 * Server-only — usar em RSC, route handlers e server actions.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { id: user.id, email: user.email ?? null, profile };
}

/**
 * Garante que o usuário está logado. Redireciona para /entrar?redirect=...
 * caso contrário. Use em layouts protegidos (Server Components).
 *
 * Já redirecionamos no proxy também — esse helper é defesa em profundidade
 * para layouts que precisam ler dados do user sem branch para null.
 */
export async function requireAuth(redirectTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const url = redirectTo
      ? `/entrar?redirect=${encodeURIComponent(redirectTo)}`
      : "/entrar";
    redirect(url);
  }
  return user;
}

/**
 * Garante que o usuário tem um dos roles permitidos. Caso contrário,
 * redireciona para a home.
 */
export async function requireRole(
  roles: UserRole | UserRole[],
  redirectTo?: string
): Promise<CurrentUser> {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const user = await requireAuth(redirectTo);
  const role = user.profile?.role ?? "client";
  if (!allowed.includes(role)) {
    redirect("/");
  }
  return user;
}
