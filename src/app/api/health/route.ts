import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TABLES = [
  "profiles",
  "services",
  "barbers",
  "working_hours",
  "time_blocks",
  "appointments",
  "appointment_services",
  "loyalty_transactions",
  "favorite_services",
] as const;

export async function GET() {
  const env = {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasSupabaseService: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasResend: Boolean(process.env.RESEND_API_KEY),
  };

  let database: Record<string, unknown> = { ok: false };
  if (env.hasSupabaseUrl && env.hasSupabaseService) {
    try {
      const admin = createAdminClient();
      const tables: Record<string, number | string> = {};
      let missing = 0;
      for (const t of TABLES) {
        const { count, error } = await admin
          .from(t)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .select("*", { count: "exact" } as any)
          .limit(1);
        if (error) {
          tables[t] = error.message ?? "error";
          missing++;
        } else {
          tables[t] = count ?? 0;
        }
      }
      database = { ok: missing === 0, missing, tables };
    } catch (e) {
      database = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({
    status: "ok",
    service: "resenha-e-corte",
    time: new Date().toISOString(),
    env,
    database,
  });
}
