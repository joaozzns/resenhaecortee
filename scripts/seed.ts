/**
 * Seed do catálogo: serviços, barbeiros e horários de funcionamento.
 *
 * Estratégia "estado-desejado":
 *  1. Desativa TODOS os serviços e barbeiros existentes.
 *  2. Faz upsert dos itens listados aqui marcando-os como active=true.
 *  3. Working_hours são re-aplicados por barbeiro ativo.
 *
 * Resultado: rodar `npm run seed` deixa o catálogo idêntico ao
 * arquivo, sem deletar histórico de agendamentos (preserva FKs).
 *
 * Uso:
 *   npm run seed
 *
 * Pré-requisitos:
 *   - Migrations aplicadas em supabase/setup.sql
 *   - .env.local com SUPABASE_SERVICE_ROLE_KEY preenchido
 */

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/types";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "✗ Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.local"
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ----------------------------------------------------------------------------
// Catálogo
// ----------------------------------------------------------------------------

// Sem `description` — os nomes falam por si na UI.
// Durações em minutos (múltiplos de 15).
const SERVICES = [
  { name: "Corte",                   duration_minutes: 30, price_cents: 3500,  category: "cabelo"     as const, sort_order: 1 },
  { name: "Freestyle",               duration_minutes: 15, price_cents: 500,   category: "cabelo"     as const, sort_order: 2 },
  { name: "Sobrancelha",             duration_minutes: 15, price_cents: 1000,  category: "tratamento" as const, sort_order: 3 },
  { name: "Barba",                   duration_minutes: 30, price_cents: 2500,  category: "barba"      as const, sort_order: 4 },
  { name: "Pigmentação",             duration_minutes: 30, price_cents: 2500,  category: "tratamento" as const, sort_order: 5 },
  { name: "Hidratação",              duration_minutes: 30, price_cents: 3000,  category: "tratamento" as const, sort_order: 6 },
  { name: "Relaxamento",             duration_minutes: 45, price_cents: 5000,  category: "tratamento" as const, sort_order: 7 },
  { name: "Nevou (Sem corte)",       duration_minutes: 60, price_cents: 10000, category: "tratamento" as const, sort_order: 8 },
  { name: "Luzes (Sem corte)",       duration_minutes: 60, price_cents: 9000,  category: "tratamento" as const, sort_order: 9 },
  { name: "Colorido (Sem corte)",    duration_minutes: 60, price_cents: 9000,  category: "tratamento" as const, sort_order: 10 },
];

const BARBERS = [
  {
    name: "Joben Marques",
    bio: "Barbeiro da casa. Conduz o atendimento com atenção ao detalhe e respeito ao tempo do cliente.",
    specialties: [],
    instagram: null,
    photo_url: "/barbers/jobenmarques.png",
    sort_order: 1,
  },
  {
    name: "Arthur",
    bio: "Atendimento atencioso e cortes versáteis — do clássico ao contemporâneo.",
    specialties: [],
    instagram: null,
    photo_url: "/barbers/arthur.png",
    sort_order: 2,
  },
];

// Horário padrão: Seg–Sex 08:00–20:00, Sáb 07:00–16:00. Dom fechado.
// weekday: 0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sáb
const WEEKLY_SCHEDULE: Array<{ weekday: number; start: string; end: string }> = [
  { weekday: 1, start: "08:00:00", end: "20:00:00" },
  { weekday: 2, start: "08:00:00", end: "20:00:00" },
  { weekday: 3, start: "08:00:00", end: "20:00:00" },
  { weekday: 4, start: "08:00:00", end: "20:00:00" },
  { weekday: 5, start: "08:00:00", end: "20:00:00" },
  { weekday: 6, start: "07:00:00", end: "16:00:00" },
];

// ----------------------------------------------------------------------------
// Execução
// ----------------------------------------------------------------------------

async function main() {
  console.log("→ Conectando em", url);

  // 0. Desativa tudo (preserva FKs / histórico)
  console.log("→ Desativando catálogo atual…");
  await supabase.from("services").update({ active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("barbers").update({ active: false }).neq("id", "00000000-0000-0000-0000-000000000000");

  // 1. Upsert serviços (active=true por padrão na coluna)
  console.log("→ Inserindo serviços…");
  for (const svc of SERVICES) {
    const { error } = await supabase
      .from("services")
      // description: null sobrescreve textos antigos em nomes reaproveitados
      // (ex.: "Barba", "Pigmentação"). Os novos serviços não usam descrição.
      .upsert({ ...svc, active: true, description: null }, { onConflict: "name" });
    if (error) throw new Error(`services[${svc.name}]: ${error.message}`);
  }
  console.log(`  ✓ ${SERVICES.length} serviços ativos`);

  // 2. Upsert barbeiros
  console.log("→ Inserindo barbeiros…");
  const insertedBarbers: Array<{ id: string; name: string }> = [];
  for (const b of BARBERS) {
    const { data, error } = await supabase
      .from("barbers")
      .upsert({ ...b, active: true }, { onConflict: "name" })
      .select("id, name")
      .single();
    if (error || !data)
      throw new Error(`barbers[${b.name}]: ${error?.message ?? "no data"}`);
    insertedBarbers.push(data);
  }
  console.log(`  ✓ ${insertedBarbers.length} barbeiros ativos`);

  // 3. Horários — upsert por (barber_id, weekday, start_time)
  console.log("→ Inserindo horários…");
  let hoursCount = 0;
  for (const barber of insertedBarbers) {
    for (const slot of WEEKLY_SCHEDULE) {
      const { error } = await supabase.from("working_hours").upsert(
        {
          barber_id: barber.id,
          weekday: slot.weekday,
          start_time: slot.start,
          end_time: slot.end,
        },
        { onConflict: "barber_id,weekday,start_time" }
      );
      if (error)
        throw new Error(
          `working_hours[${barber.name} w=${slot.weekday}]: ${error.message}`
        );
      hoursCount++;
    }
  }
  console.log(
    `  ✓ ${hoursCount} blocos de horário (6 dias × ${insertedBarbers.length})`
  );

  console.log("\n✓ Seed concluído.");
}

main().catch((err) => {
  console.error("\n✗ Seed falhou:", err.message);
  process.exit(1);
});
