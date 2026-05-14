/**
 * Ping no Supabase para validar:
 *  1. Keys e URL corretas
 *  2. Conectividade de rede
 *  3. Se as migrations já foram aplicadas (tabelas existem)
 *
 * Uso: npm run supabase:ping
 */

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Next.js usa .env.local; dotenv/config padrão lê só .env.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error(
    "✗ Faltam variáveis de ambiente. Verifique .env.local:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL\n" +
      "  NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
      "  SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

console.log("→ URL:", url);

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

async function main() {
  // 1. Auth admin (valida service role key)
  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  if (usersErr) {
    console.error("✗ service_role inválida ou sem permissão:", usersErr.message);
    process.exit(1);
  }
  console.log(`✓ Auth admin acessível (${usersData.users.length} usuário[s] na primeira página)`);

  // 2. Anon (apenas a SDK constrói; testaremos um select público abaixo)
  const anonClient = createClient(url!, anon!);

  // 3. Cada tabela — usamos um SELECT real (não head) porque o head count
  //    do PostgREST não diferencia tabela ausente vs vazia.
  let missing = 0;
  for (const t of TABLES) {
    const { error, count } = await admin
      .from(t)
      .select("*", { count: "exact" })
      .limit(1);
    if (error) {
      const msg = error.message ?? String(error);
      if (msg.includes("does not exist") || msg.includes("schema cache")) {
        console.log(`  ✗ ${t.padEnd(24)} FALTANDO`);
        missing++;
      } else {
        console.log(`  ⚠ ${t.padEnd(24)} ${msg}`);
      }
    } else {
      console.log(`  ✓ ${t.padEnd(24)} ${count ?? 0} linha(s)`);
    }
  }

  // 4. Anon precisa enxergar services (RLS pública para active=true)
  const { data: anonSvcs, error: anonErr } = await anonClient
    .from("services")
    .select("id")
    .limit(1);
  if (anonErr && !anonErr.message.includes("does not exist")) {
    console.log("  ⚠ anon → services:", anonErr.message);
  } else if (!anonErr) {
    console.log(`  ✓ anon → services (${anonSvcs?.length ?? 0} linha[s] visíveis)`);
  }

  if (missing > 0) {
    console.log(
      `\n→ ${missing} tabela(s) faltando. Aplique supabase/setup.sql no SQL Editor:\n` +
        `  https://supabase.com/dashboard/project/${url!.match(/https:\/\/(.*?)\.supabase\.co/)?.[1]}/sql/new`
    );
    process.exit(2);
  }
  console.log("\n✓ Tudo no lugar.");
}

main().catch((err) => {
  console.error("✗ Falha:", err);
  process.exit(1);
});
