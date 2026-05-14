import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
loadEnv({ path: ".env.local" });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
async function main() {
  // Apaga TODOS os blocos de horário; o seed insere os corretos em seguida.
  const { error } = await admin.from("working_hours").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
  console.log("✓ working_hours limpos");
}
main();
