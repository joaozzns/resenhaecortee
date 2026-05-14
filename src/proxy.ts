import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16+ usa `proxy.ts` no lugar de `middleware.ts`. A função export
 * default continua sendo invocada a cada request elegível pelo matcher.
 *
 * Mantemos o nome do arquivo lib/supabase/middleware.ts por convenção do
 * Supabase (a doc deles ainda chama "middleware") — só o arquivo raiz mudou.
 */
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$|api/health).*)",
  ],
};
