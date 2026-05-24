import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback unificado para:
 *  - OAuth (Google) → query string traz `?code=...`
 *  - Magic link / signup confirmation → query string traz `?code=...` também
 *  - Recovery → mesmo formato
 *
 * O exchange grava cookies httpOnly na response. Erro: redireciona para
 * /entrar com flag visual.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectParam = url.searchParams.get("redirect") ?? "/minha-conta";

  // Sanity: só permitir redirect interno
  const safeRedirect = redirectParam.startsWith("/")
    ? redirectParam
    : "/minha-conta";

  if (!code) {
    return NextResponse.redirect(
      new URL(`/entrar?error=missing_code`, request.url)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/entrar?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }

  // Delega a decisão final ao /auth/after-login (que conhece o role do user)
  return NextResponse.redirect(
    new URL(
      `/auth/after-login?fallback=${encodeURIComponent(safeRedirect)}`,
      request.url
    )
  );
}
