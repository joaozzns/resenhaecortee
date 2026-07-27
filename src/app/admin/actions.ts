"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { BRT_TZ } from "@/lib/date";

/**
 * Server actions de gestão. Toda action chama requireRole para garantir
 * (defesa em profundidade — RLS já bloqueia, mas erro daqui é mais claro).
 */

// ----------------------------------------------------------------------------
// Serviços
// ----------------------------------------------------------------------------

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.enum(["cabelo", "barba", "combo", "tratamento"]),
  duration_minutes: z.coerce
    .number()
    .int()
    .min(30)
    .max(8 * 60)
    .refine((n) => n % 30 === 0, "Múltiplo de 30"),
  price_cents: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export async function saveService(input: z.infer<typeof serviceSchema>) {
  await requireRole("admin");
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const admin = createAdminClient();
  const { id, ...rest } = parsed.data;
  const payload = { ...rest, description: rest.description || null };
  const { error } = id
    ? await admin.from("services").update(payload).eq("id", id)
    : await admin.from("services").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/servicos");
  return { ok: true };
}

export async function deleteService(id: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  // Não deletamos: desativamos para preservar histórico.
  const { error } = await admin
    .from("services")
    .update({ active: false })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/servicos");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Barbeiros
// ----------------------------------------------------------------------------

const barberSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(80),
  bio: z.string().max(1000).optional().or(z.literal("")),
  // Aceita caminho relativo (/barbers/x.png) OU URL absoluta (Supabase Storage,
  // Unsplash, etc.). O `.url()` antigo rejeitava caminhos relativos — bug que
  // impedia usar as fotos do próprio projeto pela UI.
  photo_url: z
    .string()
    .max(500)
    .refine((s) => s === "" || s.startsWith("/") || /^https?:\/\//.test(s), {
      message: "Use um caminho iniciando com / ou uma URL http(s).",
    })
    .optional()
    .or(z.literal("")),
  specialties: z.array(z.string()).default([]),
  instagram: z.string().url().optional().or(z.literal("")),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export async function saveBarber(input: z.infer<typeof barberSchema>) {
  await requireRole("admin");
  const parsed = barberSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const admin = createAdminClient();
  const { id, ...rest } = parsed.data;
  const payload = {
    ...rest,
    bio: rest.bio || null,
    photo_url: rest.photo_url || null,
    instagram: rest.instagram || null,
  };
  const { error } = id
    ? await admin.from("barbers").update(payload).eq("id", id)
    : await admin.from("barbers").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/barbeiros");
  return { ok: true };
}

export async function deleteBarber(id: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin
    .from("barbers")
    .update({ active: false })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/barbeiros");
  return { ok: true };
}

/** Reativa um barbeiro inativo (contraparte do "desativar"). */
export async function setBarberActive(id: string, active: boolean) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin
    .from("barbers")
    .update({ active })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/barbeiros");
  return { ok: true };
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Upload da foto do barbeiro para o bucket público `barbers` no Supabase
 * Storage. Retorna a URL pública (já liberada no next.config images).
 * Usa service role (bypassa RLS) — protegido por requireRole("admin").
 */
export async function uploadBarberPhoto(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireRole("admin");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Nenhum arquivo enviado." };
  const ext = PHOTO_EXT[file.type];
  if (!ext)
    return { ok: false, error: "Formato inválido. Use PNG, JPG, WEBP ou AVIF." };
  if (file.size > MAX_PHOTO_BYTES)
    return { ok: false, error: "Imagem muito grande (máx. 5 MB)." };

  const admin = createAdminClient();
  const key = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from("barbers")
    .upload(key, buffer, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: error.message };

  const { data } = admin.storage.from("barbers").getPublicUrl(key);
  return { ok: true, url: data.publicUrl };
}

// ----------------------------------------------------------------------------
// Bloqueios de horário (folga, almoço, etc.)
// ----------------------------------------------------------------------------

const blockSchema = z.object({
  id: z.string().uuid().optional(),
  barber_id: z.string().uuid(),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }),
  reason: z.string().max(200).optional().or(z.literal("")),
});

export async function saveBlock(input: z.infer<typeof blockSchema>) {
  await requireRole(["admin", "barber"]);
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  if (new Date(parsed.data.ends_at) <= new Date(parsed.data.starts_at)) {
    return { ok: false, error: "Fim deve ser após o início." };
  }
  const admin = createAdminClient();
  const { id, ...rest } = parsed.data;
  const payload = { ...rest, reason: rest.reason || null };
  const { error } = id
    ? await admin.from("time_blocks").update(payload).eq("id", id)
    : await admin.from("time_blocks").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/bloqueios");
  return { ok: true };
}

export async function deleteBlock(id: string) {
  await requireRole(["admin", "barber"]);
  const admin = createAdminClient();
  const { error } = await admin.from("time_blocks").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/bloqueios");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Agendamentos (admin: marcar concluído / no_show / cancelar)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Admin cria agendamento manual (cliente liga / aparece presencial)
// ----------------------------------------------------------------------------

const adminApptSchema = z.object({
  clientName: z.string().min(2).max(120),
  clientPhone: z.string().min(8).max(20),
  clientEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal("")),
  barberId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1),
  // Date + hora locais (BRT) — convertemos pra UTC aqui dentro
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  notes: z.string().max(500).optional().or(z.literal("")),
  // Admin pode pular conflict-check (forçar) se quiser
  force: z.boolean().default(false),
});

export async function createAdminAppointment(
  input: z.infer<typeof adminApptSchema>
) {
  await requireRole(["admin", "barber"]);
  const parsed = adminApptSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  const d = parsed.data;
  const admin = createAdminClient();

  // 1. Snapshot dos serviços (preço + duração no momento)
  const { data: services, error: svcErr } = await admin
    .from("services")
    .select("id, price_cents, duration_minutes, active")
    .in("id", d.serviceIds);
  if (svcErr) return { ok: false, error: svcErr.message };
  if (!services || services.length !== d.serviceIds.length)
    return { ok: false, error: "Algum serviço não foi encontrado." };
  if (services.some((s) => !s.active))
    return { ok: false, error: "Algum serviço está inativo." };

  const totalDuration = services.reduce((s, x) => s + x.duration_minutes, 0);
  const totalCents = services.reduce((s, x) => s + x.price_cents, 0);

  // 2. Converte (data BRT + hora BRT) → instante UTC pra gravar
  const startsAt = fromZonedTime(`${d.date}T${d.time}:00`, BRT_TZ);
  const endsAt = addMinutes(startsAt, totalDuration);

  // 3. Confere conflito a menos que force=true
  if (!d.force) {
    const { data: conflicts } = await admin
      .from("appointments")
      .select("id")
      .eq("barber_id", d.barberId)
      .neq("status", "cancelled")
      .lt("starts_at", endsAt.toISOString())
      .gt("ends_at", startsAt.toISOString());
    if (conflicts && conflicts.length > 0)
      return {
        ok: false,
        error:
          "Conflito com outro agendamento desse barbeiro. Marque 'forçar' se quiser ignorar.",
      };
  }

  // 4. Insere appointment (status confirmed direto — admin é a fonte da verdade)
  const { data: appt, error: insErr } = await admin
    .from("appointments")
    .insert({
      client_id: null, // sem vínculo com user logado
      client_name: d.clientName,
      client_email: d.clientEmail || "",
      client_phone: d.clientPhone,
      barber_id: d.barberId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
      total_cents: totalCents,
      notes: d.notes || null,
    })
    .select("id")
    .single();
  if (insErr || !appt) return { ok: false, error: insErr?.message ?? "Falha ao gravar." };

  const { error: linkErr } = await admin
    .from("appointment_services")
    .insert(
      services.map((s) => ({
        appointment_id: appt.id,
        service_id: s.id,
        price_cents: s.price_cents,
        duration_minutes: s.duration_minutes,
      }))
    );
  if (linkErr) {
    await admin.from("appointments").delete().eq("id", appt.id);
    return { ok: false, error: linkErr.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/agendamentos");
  return { ok: true, id: appt.id };
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
) {
  await requireRole(["admin", "barber"]);
  const admin = createAdminClient();
  const updates: { status: typeof status; cancelled_at?: string | null } = {
    status,
  };
  if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
  // Se admin reverter um cancelamento, limpa cancelled_at também.
  if (status !== "cancelled") updates.cancelled_at = null;
  const { error } = await admin
    .from("appointments")
    .update(updates)
    .eq("id", appointmentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/agendamentos");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Mensalistas (client_subscriptions)
// ----------------------------------------------------------------------------

const subscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  profile_id: z.string().uuid(),
  plan_name: z.string().min(2).max(80),
  price_cents: z.coerce.number().int().min(0),
  started_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD"),
  status: z.enum(["active", "paused", "cancelled"]),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function saveSubscription(
  input: z.infer<typeof subscriptionSchema>
) {
  await requireRole(["admin", "barber"]);
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  const admin = createAdminClient();
  const { id, ...rest } = parsed.data;
  const payload = { ...rest, notes: rest.notes || null };
  const { error } = id
    ? await admin.from("client_subscriptions").update(payload).eq("id", id)
    : await admin.from("client_subscriptions").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planos");
  return { ok: true };
}

export async function deleteSubscription(id: string) {
  await requireRole(["admin", "barber"]);
  const admin = createAdminClient();
  const { error } = await admin
    .from("client_subscriptions")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planos");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Pagamentos de mensalistas
// ----------------------------------------------------------------------------

const paymentSchema = z.object({
  id: z.string().uuid().optional(),
  subscription_id: z.string().uuid(),
  amount_cents: z.coerce.number().int().min(0),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD"),
  method: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function savePayment(input: z.infer<typeof paymentSchema>) {
  await requireRole(["admin", "barber"]);
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  const admin = createAdminClient();
  const { id, ...rest } = parsed.data;
  const payload = {
    ...rest,
    method: rest.method || null,
    notes: rest.notes || null,
  };
  const { error } = id
    ? await admin.from("subscription_payments").update(payload).eq("id", id)
    : await admin.from("subscription_payments").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planos");
  return { ok: true };
}

export async function deletePayment(id: string) {
  await requireRole(["admin", "barber"]);
  const admin = createAdminClient();
  const { error } = await admin
    .from("subscription_payments")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planos");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Promover/rebaixar role
// ----------------------------------------------------------------------------

export async function setUserRole(
  profileId: string,
  role: "client" | "barber" | "admin"
) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", profileId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/clientes");
  return { ok: true };
}
