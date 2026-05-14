"use server";

import { revalidatePath } from "next/cache";
import { differenceInHours } from "date-fns";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { unmaskPhone } from "@/lib/auth/schemas";

const MIN_LEAD_HOURS = Number(process.env.BOOKING_MIN_LEAD_HOURS ?? 1);

/** Garante que o agendamento é do usuário logado e está cancelável. */
async function requireOwnAppointment(appointmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const admin = createAdminClient();
  const { data: appt, error } = await admin
    .from("appointments")
    .select("id, client_id, status, starts_at")
    .eq("id", appointmentId)
    .single();
  if (error || !appt) throw new Error("Agendamento não encontrado.");
  if (appt.client_id !== user.id) throw new Error("Sem permissão.");
  return { user, appt, admin };
}

export async function cancelMyAppointment(appointmentId: string) {
  const { admin, appt } = await requireOwnAppointment(appointmentId);

  if (appt.status === "cancelled") {
    return { ok: false, error: "Já estava cancelado." };
  }
  // Permite cancelar se ainda não passou e respeita antecedência mínima
  const lead = differenceInHours(new Date(appt.starts_at), new Date());
  if (lead < MIN_LEAD_HOURS) {
    return {
      ok: false,
      error: `Cancelamentos exigem antecedência mínima de ${MIN_LEAD_HOURS}h.`,
    };
  }

  const { error } = await admin
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", appointmentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/minha-conta");
  revalidatePath("/minha-conta/agendamentos");
  return { ok: true };
}

const rateSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional(),
});

export async function rateMyAppointment(input: z.infer<typeof rateSchema>) {
  const parsed = rateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const { admin, appt } = await requireOwnAppointment(parsed.data.appointmentId);
  if (new Date(appt.starts_at) > new Date()) {
    return { ok: false, error: "Só dá pra avaliar após o atendimento." };
  }
  const { error } = await admin
    .from("appointments")
    .update({
      rating: parsed.data.rating,
      review: parsed.data.review ?? null,
    })
    .eq("id", parsed.data.appointmentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/minha-conta/agendamentos");
  return { ok: true };
}

const profileSchema = z.object({
  full_name: z.string().min(3).max(120),
  phone: z.string().min(8).max(20),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  notification_email: z.boolean(),
  notification_whatsapp: z.boolean(),
});

export async function updateMyProfile(input: z.infer<typeof profileSchema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }
  // Telefone armazenado mascarado para mostrar bonito; o agendamento usa
  // o que o cliente digita em cada reserva.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      birthdate: parsed.data.birthdate || null,
      notification_email: parsed.data.notification_email,
      notification_whatsapp: parsed.data.notification_whatsapp,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  // Mantém metadata em auth.users em sincronia (telefone usado em signup)
  await supabase.auth.updateUser({
    data: {
      full_name: parsed.data.full_name,
      phone: unmaskPhone(parsed.data.phone),
    },
  });

  revalidatePath("/minha-conta");
  revalidatePath("/minha-conta/perfil");
  return { ok: true };
}

export async function setFavoriteBarber(barberId: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  const { error } = await supabase
    .from("profiles")
    .update({ favorite_barber_id: barberId })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/minha-conta/favoritos");
  return { ok: true };
}

export async function toggleFavoriteService(serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  // Se já existe, remove. Caso contrário, insere.
  const { data: existing } = await supabase
    .from("favorite_services")
    .select("service_id")
    .eq("profile_id", user.id)
    .eq("service_id", serviceId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorite_services")
      .delete()
      .eq("profile_id", user.id)
      .eq("service_id", serviceId);
  } else {
    await supabase
      .from("favorite_services")
      .insert({ profile_id: user.id, service_id: serviceId });
  }
  revalidatePath("/minha-conta/favoritos");
  return { ok: true, favorited: !existing };
}
