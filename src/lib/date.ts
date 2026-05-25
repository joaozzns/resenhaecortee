import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

/**
 * Timezone canônico de exibição. O banco guarda TIMESTAMPTZ, então o valor
 * "verdadeiro" é UTC; renderizamos sempre em BRT (Brasil sem DST desde 2019).
 *
 * IMPORTANTE: nunca use `format(new Date(starts_at), 'HH:mm')` direto, pois
 * o resultado depende do TZ do runtime (Vercel = UTC, browser do user = local).
 * Use `fmtBRT(...)` sempre que exibir hora de TIMESTAMPTZ.
 */
export const BRT_TZ = "America/Sao_Paulo";

export function fmtBRT(date: Date | string, pattern: string): string {
  return formatInTimeZone(date, BRT_TZ, pattern, { locale: ptBR });
}
