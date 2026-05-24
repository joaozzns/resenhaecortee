import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";

/**
 * Após qualquer fluxo de login (senha, OAuth, magic link), envia o usuário
 * pro destino certo:
 *  - Se há `?fallback=` com rota não-default → respeita (cobre o "?redirect="
 *    propagado durante o checkout do agendamento, por exemplo).
 *  - Senão: staff (admin/barber) vai pro /admin, cliente vai pro /minha-conta.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const fallback = url.searchParams.get("fallback") ?? "/minha-conta";
  const safeFallback =
    fallback.startsWith("/") && !fallback.startsWith("//")
      ? fallback
      : "/minha-conta";

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  if (safeFallback !== "/minha-conta") {
    return NextResponse.redirect(new URL(safeFallback, request.url));
  }

  const role = user.profile?.role ?? "client";
  const dest = role === "admin" || role === "barber" ? "/admin" : "/minha-conta";
  return NextResponse.redirect(new URL(dest, request.url));
}
