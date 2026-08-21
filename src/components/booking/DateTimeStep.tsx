"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, addDays, startOfToday } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import "react-day-picker/style.css";
import type { Slot } from "@/lib/booking/availability";
import { TimeSlotPicker } from "./TimeSlotPicker";

const MAX_LEAD_DAYS = Number(
  process.env.NEXT_PUBLIC_BOOKING_MAX_LEAD_DAYS ?? 60
);

/**
 * Passo 3 — escolher data e horário.
 *  - Calendário react-day-picker, locale pt-BR
 *  - Dias passados e além do MAX_LEAD desabilitados
 *  - Quando o dia muda, fetch /api/availability e popula a grade
 *  - Erro de rede mostra mensagem inline (não toast)
 */
export function DateTimeStep({
  barberId,
  durationMinutes,
  selectedDate,
  selectedTime,
  onSelectSlot,
  hideHeader = false,
}: {
  barberId: string;
  durationMinutes: number;
  selectedDate: string | null;
  selectedTime: string | null;
  onSelectSlot: (date: string, slot: Slot) => void;
  /** Oculta o cabeçalho "Passo 3" — usado ao reaproveitar no reagendamento. */
  hideHeader?: boolean;
}) {
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? new Date(`${selectedDate}T12:00:00`) : undefined
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza com props mudando — necessário porque o pai (BookingStepper)
  // controla a data via search params e pode mudá-la (ex.: "voltar" no stepper).
  useEffect(() => {
    if (!selectedDate) return;
    const d = new Date(`${selectedDate}T12:00:00`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate((prev) =>
      prev?.toDateString() === d.toDateString() ? prev : d
    );
  }, [selectedDate]);

  // Buscar slots quando muda data, barbeiro ou duração — sincronização com
  // a API externa, regra do hook não se aplica (essa é a forma idiomática).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!date) return;
    const ymd = format(date, "yyyy-MM-dd");
    setLoading(true);
    setError(null);
    const ctrl = new AbortController();
    fetch(
      `/api/availability?barberId=${encodeURIComponent(
        barberId
      )}&date=${ymd}&durationMinutes=${durationMinutes}`,
      // no-store: disponibilidade muda a cada agendamento; nunca servir do
      // cache do browser, senão um horário recém-ocupado aparece livre.
      { signal: ctrl.signal, cache: "no-store" }
    )
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data: { slots: Slot[] }) => setSlots(data.slots))
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError(e.message ?? "Não consegui carregar os horários.");
        setSlots([]);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [date, barberId, durationMinutes]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handlePick(slot: Slot) {
    if (!date) return;
    const ymd = format(date, "yyyy-MM-dd");
    onSelectSlot(ymd, slot);
  }

  const today = startOfToday();
  const maxDate = addDays(today, MAX_LEAD_DAYS);

  return (
    <div className="space-y-8">
      {!hideHeader && (
        <header className="space-y-3">
          <span className="eyebrow flex items-center gap-3">
            <span className="gold-rule" /> Passo 3
          </span>
          <h2 className="text-3xl md:text-4xl font-display">
            Quando você quer vir?
          </h2>
          <p className="text-foreground/70 text-sm md:text-base leading-relaxed max-w-2xl">
            Escolha primeiro o dia, depois o horário. Mostramos só o que está
            livre — nada de surpresa.
          </p>
        </header>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted">
              <CalendarDays className="h-4 w-4 text-accent" aria-hidden />
              <span>Selecione a data</span>
            </div>
            <DayPicker
              mode="single"
              locale={ptBR}
              selected={date}
              onSelect={setDate}
              disabled={[{ before: today }, { after: maxDate }]}
              showOutsideDays={false}
              weekStartsOn={1}
              classNames={dayPickerClasses}
              components={{ Chevron: NavChevron }}
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:p-6 min-h-[280px]">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted">
                {date
                  ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
                  : "Selecione uma data ao lado"}
              </p>
              {selectedTime && (
                <span className="text-xs text-accent font-medium tabular-nums">
                  Selecionado: {selectedTime}
                </span>
              )}
            </div>

            {!date ? (
              <p className="text-sm text-muted">
                Os horários aparecem aqui assim que você escolher um dia.
              </p>
            ) : error ? (
              <p className="text-sm text-danger">{error}</p>
            ) : (
              <TimeSlotPicker
                slots={slots}
                selected={selectedTime}
                onSelect={handlePick}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Setinhas de navegação entre meses. Usamos ícones lucide (currentColor) para
 * herdarem a cor do botão (foreground → accent no hover) e ficarem sempre
 * visíveis — sem isso o cliente não consegue avançar para o mês seguinte.
 */
function NavChevron({
  orientation,
}: {
  orientation?: "left" | "right" | "up" | "down";
}) {
  const Icon = orientation === "right" ? ChevronRight : ChevronLeft;
  return <Icon className="h-4 w-4" aria-hidden />;
}

/**
 * react-day-picker v9 aceita classNames por slot. Sobrescrevemos com
 * tokens da marca. Os data-attributes (selected/disabled/today) entram via
 * variants básicas — mantenho minimalista, leitura > flair.
 *
 * Importante: sobrescrever um slot REMOVE a classe `rdp-*` padrão (e o CSS de
 * posicionamento que vem com ela). Por isso a barra de navegação e as setas
 * são posicionadas manualmente aqui — a `nav` fica sobreposta ao topo (mês
 * centralizado, setas nas pontas) e continua clicável.
 */
const dayPickerClasses: React.ComponentProps<typeof DayPicker>["classNames"] = {
  root: "[--rdp-cell-size:38px] text-foreground",
  months: "relative flex flex-col gap-4",
  month_caption: "flex items-center justify-center h-10 mb-2",
  caption_label:
    "font-display text-base capitalize text-foreground tracking-tight",
  nav: "absolute inset-x-0 top-0 z-10 flex h-10 items-center justify-between",
  button_previous:
    "grid place-items-center h-8 w-8 rounded-full border border-border text-foreground hover:border-accent hover:text-accent transition-colors aria-disabled:opacity-30 aria-disabled:pointer-events-none",
  button_next:
    "grid place-items-center h-8 w-8 rounded-full border border-border text-foreground hover:border-accent hover:text-accent transition-colors aria-disabled:opacity-30 aria-disabled:pointer-events-none",
  weekdays: "grid grid-cols-7 gap-1 text-center mb-1",
  weekday:
    "text-[10px] uppercase tracking-[0.18em] text-muted font-medium pb-2",
  weeks: "flex flex-col gap-1",
  week: "grid grid-cols-7 gap-1",
  day: "aspect-square",
  day_button:
    "w-full h-full grid place-items-center rounded-full text-sm tabular-nums " +
    "text-foreground hover:bg-surface-2 transition-colors " +
    "data-[selected=true]:!bg-accent data-[selected=true]:!text-background " +
    "data-[today=true]:font-semibold data-[today=true]:text-accent " +
    "data-[disabled=true]:text-muted/40 data-[disabled=true]:hover:bg-transparent data-[disabled=true]:cursor-not-allowed",
  outside: "opacity-30",
  hidden: "hidden",
};
