import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

/**
 * Refresh da sessão a cada request. Sem isso, tokens expirados não são
 * renovados e Server Components veem o usuário como deslogado mesmo
 * quando ainda há refresh token válido.
 *
 * Não chamar nada entre createServerClient() e supabase.auth.getUser() —
 * essa ordem garante que o cookie seja gravado no response final.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: não remover essa linha. É ela que dispara o refresh do token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteção de rotas: /minha-conta e /admin exigem login.
  // (Verificação de role 'admin' acontece no layout de /admin, com acesso ao DB.)
  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/minha-conta") || path.startsWith("/admin");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return response;
}
