import { fmtBRT } from "@/lib/date";
import { siteConfig } from "@/lib/site";

type Input = {
  client_name: string;
  client_phone: string | null;
  starts_at: string;
  barber_name: string | null;
};

/**
 * Monta o link wa.me com a mensagem de confirmação do agendamento.
 * Normaliza o telefone (remove máscara) e prefixa DDI 55 quando ausente.
 * Retorna null se o número for inválido — chamadores devem esconder o botão.
 */
export function buildAppointmentConfirmLink(a: Input): string | null {
  if (!a.client_phone) return null;
  const digits = a.client_phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withDdi = digits.startsWith("55") ? digits : `55${digits}`;
  const first = a.client_name.split(" ")[0] || "";
  const data = fmtBRT(a.starts_at, "EEEE, dd/MM");
  const hora = fmtBRT(a.starts_at, "HH:mm");
  const barber = a.barber_name ? ` com ${a.barber_name}` : "";
  const msg =
    `Olá${first ? `, ${first}` : ""}! Aqui é da ${siteConfig.name}.\n` +
    `Confirmamos seu horário para ${data} às ${hora}${barber}.\n` +
    `Te esperamos! Qualquer coisa é só responder por aqui.`;
  return `https://wa.me/${withDdi}?text=${encodeURIComponent(msg)}`;
}
