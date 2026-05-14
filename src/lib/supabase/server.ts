import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Lê e escreve cookies de sessão. Sempre `await` ao chamar.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Em RSC puros essa chamada falha; é seguro ignorar.
          // O middleware faz o refresh real da sessão.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* RSC: ignorar */
          }
        },
      },
    }
  );
}

/**
 * Cliente com service role — bypassa RLS. SERVER-ONLY.
 * Usar apenas em Route Handlers e scripts, nunca em código que possa
 * vazar para o cliente. Ex.: criação de agendamento, seed, admin webhooks.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createAdminClient: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente."
    );
  }
  return createServiceClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
