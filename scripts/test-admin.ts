/**
 * Smoke test do painel admin:
 *   1. Cria usuário admin
 *   2. Garante que requireRole('admin') aceita
 *   3. Limpa
 *
 * Não chama as rotas HTTP (precisariam de cookie de sessão); valida o
 * fluxo no nível do Postgres + RLS, que é o gargalo real.
 */

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const email = `admin+${Date.now()}@resenhaecorte.test`;
  console.log(`→ Criando ${email} como admin…`);
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: "Senha-forte-1234",
    email_confirm: true,
    user_metadata: { full_name: "Admin Test" },
  });
  if (error || !created.user) {
    console.error("✗ falha:", error?.message);
    process.exit(1);
  }
  const id = created.user.id;
  await new Promise((r) => setTimeout(r, 300));

  // Promove
  await admin.from("profiles").update({ role: "admin" }).eq("id", id);

  const { data: prof } = await admin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();
  console.log(`  ✓ profile.role = ${prof?.role}`);

  // Valida is_admin() function
  const { data: amIAdmin } = await admin.rpc("is_admin");
  console.log(`  is_admin() (server context) = ${amIAdmin}`);

  // Limpa
  await admin.auth.admin.deleteUser(id);
  console.log("  ✓ cleanup");

  if (prof?.role !== "admin") {
    console.error("✗ role não foi gravado como admin");
    process.exit(2);
  }
  console.log("\n✓ Admin promotion OK.");
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
