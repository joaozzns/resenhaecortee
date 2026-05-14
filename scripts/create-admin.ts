/**
 * Cria (ou promove) um usuário a admin.
 * Uso: npx tsx scripts/create-admin.ts <email> <senha> [<full_name>]
 *
 * - Se já existe na auth.users, não recria — apenas promove.
 * - Marca email_confirm=true (não precisa abrir e-mail).
 * - Atualiza profiles.role = 'admin'.
 */

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const [, , email, password, fullName] = process.argv;
if (!email || !password) {
  console.error(
    "Uso: npx tsx scripts/create-admin.ts <email> <senha> [<full_name>]"
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // Verifica se já existe
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = existing.users.find((u) => u.email === email);

  let userId: string;
  if (found) {
    userId = found.id;
    console.log(`→ Usuário já existe (${userId.slice(0, 8)}…). Promovendo…`);
    // Atualiza senha caso tenha mudado
    await admin.auth.admin.updateUserById(userId, { password });
  } else {
    console.log("→ Criando usuário…");
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : {},
    });
    if (error || !data.user) {
      console.error("✗ create:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`  ✓ user.id = ${userId.slice(0, 8)}…`);
  }

  // Aguarda trigger e promove
  await new Promise((r) => setTimeout(r, 300));
  const { error: roleErr } = await admin
    .from("profiles")
    .update({
      role: "admin",
      ...(fullName ? { full_name: fullName } : {}),
    })
    .eq("id", userId);
  if (roleErr) {
    console.error("✗ promote:", roleErr.message);
    process.exit(1);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .single();
  console.log(`  ✓ profile: role=${profile?.role}, name=${profile?.full_name}`);
  console.log(`\n✓ ${email} é admin.`);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
