import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
loadEnv({ path: ".env.local" });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

const KEEP = ["Joben Marques", "Lucas Marques"];

async function main() {
  const { data: all } = await admin.from("barbers").select("id, name");
  const toDelete = (all ?? []).filter((b) => !KEEP.includes(b.name));
  console.log(`→ Encontrados ${all?.length} barbeiros, removendo ${toDelete.length}…`);
  for (const b of toDelete) {
    // Conferir se tem appointments
    const { count } = await admin
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("barber_id", b.id);
    if (count && count > 0) {
      console.log(`  ⚠ ${b.name} tem ${count} agendamento(s) — pulando (FK restrict)`);
      continue;
    }
    const { error } = await admin.from("barbers").delete().eq("id", b.id);
    if (error) console.log(`  ✗ ${b.name}: ${error.message}`);
    else console.log(`  ✓ ${b.name} removido`);
  }
  // Listagem final
  const { data: final } = await admin.from("barbers").select("name, active").order("sort_order");
  console.log("\nBarbeiros restantes:");
  for (const f of final ?? []) console.log(`  ${f.active ? "✓" : "✗"} ${f.name}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
