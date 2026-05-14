import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: services } = await admin
    .from("services")
    .select("name, price_cents, duration_minutes, category, active, description")
    .order("sort_order");

  console.log(`SERVIÇOS (${services?.length} total):`);
  for (const s of services ?? []) {
    const flag = s.active ? "✓" : "✗";
    const price = (s.price_cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const desc = s.description ? ` [desc: ${s.description.slice(0, 40)}…]` : "";
    console.log(
      `  ${flag} ${s.name.padEnd(28)} ${price.padStart(10)}  ${s.duration_minutes}min  ${s.category}${desc}`
    );
  }

  const { data: barbers } = await admin
    .from("barbers")
    .select("name, active")
    .order("sort_order");

  console.log(`\nBARBEIROS (${barbers?.length} total):`);
  for (const b of barbers ?? []) {
    const flag = b.active ? "✓" : "✗";
    console.log(`  ${flag} ${b.name}`);
  }
}
main();
