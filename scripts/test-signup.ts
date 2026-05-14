/**
 * Smoke test do fluxo de signup. Cria usuário via auth.admin (mais confiável
 * que signUp aqui pois a confirmação por e-mail pode estar ativa), verifica
 * se o trigger handle_new_user populou public.profiles e depois limpa.
 *
 * Uso: npx tsx scripts/test-signup.ts
 */

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const testEmail = `test+${Date.now()}@resenhaecorte.test`;
const fullName = "Teste Automatizado";
const phone = "(31) 9 1234-5678";

async function main() {
  console.log(`→ Criando usuário ${testEmail}…`);
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: "Senha-forte-1234",
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });
  if (createErr || !created.user) {
    console.error("✗ falha:", createErr?.message);
    process.exit(1);
  }
  const userId = created.user.id;
  console.log(`  ✓ user.id = ${userId}`);

  // Pequeno delay para garantir que o trigger rodou (é síncrono mas seguro)
  await new Promise((r) => setTimeout(r, 500));

  console.log("→ Verificando profile criado pelo trigger…");
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("id, role, full_name, phone, loyalty_points")
    .eq("id", userId)
    .single();

  if (profErr || !profile) {
    console.error("✗ trigger não criou profile:", profErr?.message);
    await admin.auth.admin.deleteUser(userId);
    process.exit(2);
  }

  const ok =
    profile.role === "client" &&
    profile.full_name === fullName &&
    profile.phone === phone &&
    profile.loyalty_points === 0;

  console.log(`  ${ok ? "✓" : "✗"} profile:`, profile);

  console.log("→ Limpando…");
  await admin.auth.admin.deleteUser(userId);
  console.log("  ✓ usuário removido");

  if (!ok) {
    console.error("\n✗ campos do profile não bateram com o esperado");
    process.exit(3);
  }

  console.log("\n✓ Trigger handle_new_user funciona ponta a ponta.");
}

main().catch((e) => {
  console.error("✗ erro:", e);
  process.exit(1);
});
