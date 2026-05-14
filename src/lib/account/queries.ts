import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

/**
 * Server-only: queries da área do cliente.
 * Usamos o admin client para joins amplos (RLS dificulta join via PostgREST),
 * mas SEMPRE filtramos por client_id = userId. Nada de admin sem filtro.
 */

export type AppointmentWithDetails = Tables<"appointments"> & {
  barber: Pick<Tables<"barbers">, "id" | "name" | "photo_url"> | null;
  services: Array<{
    service_id: string;
    name: string;
    price_cents: number;
    duration_minutes: number;
  }>;
};

export async function getMyAppointments(
  userId: string,
  scope: "upcoming" | "past" | "cancelled" | "all" = "all"
): Promise<AppointmentWithDetails[]> {
  const admin = createAdminClient();

  let query = admin
    .from("appointments")
    .select(
      `
      *,
      barber:barbers ( id, name, photo_url ),
      appointment_services (
        service_id,
        price_cents,
        duration_minutes,
        services ( name )
      )
    `
    )
    .eq("client_id", userId)
    .order("starts_at", { ascending: scope === "upcoming" });

  const nowIso = new Date().toISOString();
  if (scope === "upcoming") {
    query = query
      .gte("starts_at", nowIso)
      .neq("status", "cancelled");
  } else if (scope === "past") {
    query = query.lt("starts_at", nowIso).neq("status", "cancelled");
  } else if (scope === "cancelled") {
    query = query.eq("status", "cancelled");
  }

  const { data, error } = await query;
  if (error) throw error;

  // Normaliza appointment_services para um array plano
  return (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    return {
      ...r,
      services: (r.appointment_services ?? []).map((x: {
        service_id: string;
        price_cents: number;
        duration_minutes: number;
        services: { name: string } | null;
      }) => ({
        service_id: x.service_id,
        price_cents: x.price_cents,
        duration_minutes: x.duration_minutes,
        name: x.services?.name ?? "Serviço removido",
      })),
    } as AppointmentWithDetails;
  });
}

export type ClientStats = {
  totalVisits: number;
  favoriteBarberName: string | null;
  topServiceName: string | null;
  loyaltyPoints: number;
};

export async function getClientStats(userId: string): Promise<ClientStats> {
  const admin = createAdminClient();

  // Pontos de fidelidade vêm direto do profile
  const { data: profile } = await admin
    .from("profiles")
    .select("loyalty_points")
    .eq("id", userId)
    .single();

  // Total de atendimentos (status completed ou confirmed em datas passadas)
  const nowIso = new Date().toISOString();
  const { data: past } = await admin
    .from("appointments")
    .select("id, barber_id")
    .eq("client_id", userId)
    .lt("starts_at", nowIso)
    .neq("status", "cancelled");

  const totalVisits = past?.length ?? 0;

  // Barbeiro mais frequente
  let favoriteBarberName: string | null = null;
  if (past && past.length > 0) {
    const counts = new Map<string, number>();
    for (const a of past) {
      counts.set(a.barber_id, (counts.get(a.barber_id) ?? 0) + 1);
    }
    const topBarberId = Array.from(counts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    if (topBarberId) {
      const { data: b } = await admin
        .from("barbers")
        .select("name")
        .eq("id", topBarberId)
        .single();
      favoriteBarberName = b?.name ?? null;
    }
  }

  // Serviço mais usado
  let topServiceName: string | null = null;
  if (past && past.length > 0) {
    const apptIds = past.map((p) => p.id);
    const { data: links } = await admin
      .from("appointment_services")
      .select("service_id, services(name)")
      .in("appointment_id", apptIds);
    if (links && links.length > 0) {
      const counts = new Map<string, { count: number; name: string }>();
      for (const l of links) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = (l as any).services?.name ?? "?";
        const cur = counts.get(l.service_id) ?? { count: 0, name };
        cur.count++;
        counts.set(l.service_id, cur);
      }
      const top = Array.from(counts.values()).sort(
        (a, b) => b.count - a.count
      )[0];
      topServiceName = top?.name ?? null;
    }
  }

  return {
    totalVisits,
    favoriteBarberName,
    topServiceName,
    loyaltyPoints: profile?.loyalty_points ?? 0,
  };
}

/**
 * Busca o último agendamento do cliente para "Repetir último corte".
 */
export async function getLastAppointment(userId: string) {
  const admin = createAdminClient();
  const { data: appt } = await admin
    .from("appointments")
    .select(
      `id, barber_id, appointment_services ( service_id )`
    )
    .eq("client_id", userId)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!appt) return null;
  return {
    barberId: appt.barber_id,
    // PostgREST inferiu tipo errado para o join; cast através de unknown.
    serviceIds: (
      appt.appointment_services as unknown as Array<{ service_id: string }>
    ).map((x) => x.service_id),
  };
}

/**
 * Helper de auth para garantir que estamos no contexto do dono.
 */
export async function getMyProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return profile ? { user, profile } : null;
}
