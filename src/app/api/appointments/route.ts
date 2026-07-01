import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { addMinutes } from "date-fns";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ensureSlotAvailable } from "@/lib/booking/availability";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, "Escolha ao menos um serviço"),
  // 'any' é resolvido para um barbeiro real antes de gravar
  barberId: z.string().min(1),
  startsAtUtc: z.string().datetime({ offset: true }),
  client: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    phone: z.string().min(8),
  }),
  notes: z.string().max(500).optional(),
  acceptTerms: z.boolean().refine((v) => v === true, "Aceite os termos"),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // 0. Autenticação obrigatória — não é possível agendar sem conta.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "É necessário ter uma conta para agendar um horário." },
      { status: 401 }
    );
  }
  const clientId = user.id;

  const admin = createAdminClient();

  // 1. Carregar serviços (snapshot de preço/duração para gravar no pedido)
  const { data: services, error: svcErr } = await admin
    .from("services")
    .select("id, name, price_cents, duration_minutes, active")
    .in("id", input.serviceIds);
  if (svcErr) {
    return NextResponse.json({ error: svcErr.message }, { status: 500 });
  }
  if (services.length !== input.serviceIds.length) {
    return NextResponse.json(
      { error: "Um ou mais serviços não foram encontrados." },
      { status: 400 }
    );
  }
  if (services.some((s) => !s.active)) {
    return NextResponse.json(
      { error: "Há serviços indisponíveis no pedido." },
      { status: 400 }
    );
  }

  const totalDuration = services.reduce((s, x) => s + x.duration_minutes, 0);
  const totalCents = services.reduce((s, x) => s + x.price_cents, 0);
  const startsAt = new Date(input.startsAtUtc);
  const endsAt = addMinutes(startsAt, totalDuration);

  // 2. Resolver barbeiro: 'any' → primeiro disponível
  let barberId = input.barberId;
  if (barberId === "any") {
    const { data: actives } = await admin
      .from("barbers")
      .select("id")
      .eq("active", true);
    if (!actives || actives.length === 0) {
      return NextResponse.json(
        { error: "Nenhum barbeiro ativo." },
        { status: 400 }
      );
    }
    let picked: string | null = null;
    for (const b of actives) {
      const ok = await ensureSlotAvailable({
        barberId: b.id,
        startsAtUtc: startsAt.toISOString(),
        endsAtUtc: endsAt.toISOString(),
      });
      if (ok.ok) {
        picked = b.id;
        break;
      }
    }
    if (!picked) {
      return NextResponse.json(
        { error: "Nenhum barbeiro disponível nesse horário." },
        { status: 409 }
      );
    }
    barberId = picked;
  } else {
    // Re-checar disponibilidade do barbeiro escolhido
    const ok = await ensureSlotAvailable({
      barberId,
      startsAtUtc: startsAt.toISOString(),
      endsAtUtc: endsAt.toISOString(),
    });
    if (!ok.ok) {
      return NextResponse.json({ error: ok.reason }, { status: 409 });
    }
  }

  // 3. Inserir appointment + appointment_services
  // Tentamos por unique-ish: se a constraint do índice parcial não existe,
  // a re-checagem acima é a defesa principal. Em produção considerar
  // EXCLUDE USING gist com tstzrange para garantia atômica.
  const { data: appt, error: insErr } = await admin
    .from("appointments")
    .insert({
      client_id: clientId,
      client_name: input.client.name,
      client_email: input.client.email,
      client_phone: input.client.phone,
      barber_id: barberId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      total_cents: totalCents,
      notes: input.notes ?? null,
    })
    .select("id, cancel_token, starts_at, ends_at, barber_id, total_cents")
    .single();

  if (insErr || !appt) {
    return NextResponse.json(
      { error: insErr?.message ?? "Falha ao gravar agendamento." },
      { status: 500 }
    );
  }

  const linkRows = services.map((s) => ({
    appointment_id: appt.id,
    service_id: s.id,
    price_cents: s.price_cents,
    duration_minutes: s.duration_minutes,
  }));
  const { error: linkErr } = await admin
    .from("appointment_services")
    .insert(linkRows);
  if (linkErr) {
    // Rollback manual — agendamento sem serviços não faz sentido
    await admin.from("appointments").delete().eq("id", appt.id);
    return NextResponse.json({ error: linkErr.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      appointment: {
        id: appt.id,
        cancelToken: appt.cancel_token,
        startsAt: appt.starts_at,
        endsAt: appt.ends_at,
        barberId: appt.barber_id,
        totalCents: appt.total_cents,
      },
    },
    { status: 201 }
  );
}
