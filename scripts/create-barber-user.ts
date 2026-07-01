/**
 * Cria (ou promove) um usuário com role='barber' e vincula ao registro
 * em public.barbers pelo nome.
 *
 * Uso: npx tsx scripts/create-barber-user.ts <email> <senha> <nome-do-barbeiro>
 *
 * - Se o usuário já existe em auth.users, apenas atualiza senha + role.
 * - Marca email_confirm=true (login imediato).
 * - Atualiza profiles.role='barber' e full_name.
 * - Faz UPDATE em public.barbers para setar profile_id pelo nome.
 *   (O registro do barbeiro precisa existir — rode `npm run seed` antes.)
 */

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const [, , email, password, ...rest] = process.argv;
const fullName = rest.join(" ").trim();

if (!email || !password || !fullName) {
  console.error(
    "Uso: npx tsx scripts/create-barber-user.ts <email> <senha> <nome-do-barbeiro>"
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // 1. Garante o usuário em auth.users
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = existing.users.find((u) => u.email === email);

  let userId: string;
  if (found) {
    userId = found.id;
    console.log(`→ Usuário já existe (${userId.slice(0, 8)}…). Atualizando senha…`);
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) {
      console.error("✗ updatePassword:", error.message);
      process.exit(1);
    }
  } else {
    console.log("→ Criando usuário…");
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !data.user) {
      console.error("✗ create:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`  ✓ user.id = ${userId.slice(0, 8)}…`);
  }

  // 2. Aguarda trigger de profiles e promove
  await new Promise((r) => setTimeout(r, 300));
  const { error: roleErr } = await admin
    .from("profiles")
    .update({ role: "barber", full_name: fullName })
    .eq("id", userId);
  if (roleErr) {
    console.error("✗ promote:", roleErr.message);
    process.exit(1);
  }
  console.log(`  ✓ profile: role=barber, full_name=${fullName}`);

  // 3. Vincula ao registro em public.barbers pelo nome
  const { data: barber, error: findErr } = await admin
    .from("barbers")
    .select("id, name, profile_id")
    .eq("name", fullName)
    .maybeSingle();
  if (findErr) {
    console.error("✗ find barber:", findErr.message);
    process.exit(1);
  }
  if (!barber) {
    console.error(
      `✗ Nenhum registro em public.barbers com name="${fullName}". Rode \`npm run seed\` antes.`
    );
    process.exit(1);
  }

  if (barber.profile_id === userId) {
    console.log(`  · barber.profile_id já estava vinculado`);
  } else {
    const { error: linkErr } = await admin
      .from("barbers")
      .update({ profile_id: userId })
      .eq("id", barber.id);
    if (linkErr) {
      console.error("✗ link barber:", linkErr.message);
      process.exit(1);
    }
    console.log(`  ✓ barbers.profile_id vinculado (barber.id=${barber.id.slice(0, 8)}…)`);
  }

  console.log(`\n✓ ${email} é barbeiro (${fullName}).`);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
