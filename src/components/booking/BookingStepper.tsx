"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Stepper } from "./Stepper";
import { ServicePickerStep } from "./ServicePickerStep";
import { BarberPickerStep } from "./BarberPickerStep";
import { DateTimeStep } from "./DateTimeStep";
import { ConfirmStep } from "./ConfirmStep";
import { BookingSuccess } from "./BookingSuccess";
import { BookingSummaryBar } from "./BookingSummaryBar";
import {
  EMPTY_STATE,
  STEPS,
  type Service,
  type Barber,
  type StepId,
  type BookingState,
} from "@/lib/booking/types";
import type { CurrentUser } from "@/lib/auth/helpers";

/**
 * Orquestrador do fluxo. Mantém o estado em URL search params para suportar
 * refresh, deep-link e back/forward do browser.
 *
 * Search params:
 *   step=servicos|barbeiro|horario|confirmar
 *   service=<id>,<id>,...
 *   barber=any|<uuid>
 *   date=YYYY-MM-DD
 *   time=HH:MM
 */
export function BookingStepper({
  services,
  barbers,
  user,
}: {
  services: Service[];
  barbers: Barber[];
  user: CurrentUser | null;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();

  // ----- Hidrata o estado do search params -----
  const initialServices = useMemo(() => {
    // Aceita ?service=ID (singular, vindo do card da Home/serviços) ou plural
    const single = params.get("service");
    const csv = params.get("services");
    const ids = (csv ?? single ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return ids.filter((id) => services.some((s) => s.id === id));
  }, [params, services]);

  const initialBarber = useMemo(() => {
    const b = params.get("barber");
    if (!b) return null;
    if (b === "any") return "any";
    return barbers.some((x) => x.id === b) ? b : null;
  }, [params, barbers]);

  const [state, setState] = useState<BookingState>(() => ({
    ...EMPTY_STATE,
    serviceIds: initialServices,
    barberId: initialBarber,
    date: params.get("date"),
    time: params.get("time"),
  }));

  const [step, setStep] = useState<StepId>(() => {
    const requested = params.get("step") as StepId | null;
    if (requested && STEPS.some((s) => s.id === requested)) return requested;
    if (initialServices.length === 0) return "servicos";
    if (!initialBarber) return "barbeiro";
    return "horario";
  });

  const [reachedMax, setReachedMax] = useState<number>(() =>
    Math.max(STEPS.findIndex((s) => s.id === step), 0)
  );

  const [success, setSuccess] = useState<{
    id: string;
    cancelToken: string;
  } | null>(null);

  // ----- Sincroniza state → URL (sem disparar navigation visível) -----
  useEffect(() => {
    if (success) return;
    const sp = new URLSearchParams();
    sp.set("step", step);
    if (state.serviceIds.length > 0)
      sp.set("services", state.serviceIds.join(","));
    if (state.barberId) sp.set("barber", state.barberId);
    if (state.date) sp.set("date", state.date);
    if (state.time) sp.set("time", state.time);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, step, success]);

  // ----- Derivações -----
  const selectedServices = services.filter((s) =>
    state.serviceIds.includes(s.id)
  );
  const totalDuration = selectedServices.reduce(
    (s, x) => s + x.duration_minutes,
    0
  );

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const reachedIds = STEPS.slice(0, reachedMax + 1).map((s) => s.id);

  // ----- Ações -----
  const goTo = useCallback(
    (id: StepId) => {
      setStep(id);
      const i = STEPS.findIndex((s) => s.id === id);
      setReachedMax((m) => Math.max(m, i));
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }
    },
    [reduce]
  );

  const next = useCallback(() => {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i < STEPS.length - 1) goTo(STEPS[i + 1].id);
  }, [step, goTo]);

  const prev = useCallback(() => {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i > 0) goTo(STEPS[i - 1].id);
  }, [step, goTo]);

  function toggleService(id: string) {
    setState((prev) => {
      const has = prev.serviceIds.includes(id);
      return {
        ...prev,
        serviceIds: has
          ? prev.serviceIds.filter((x) => x !== id)
          : [...prev.serviceIds, id],
        // Mudança de serviços invalida horário (duração mudou)
        time: null,
        startsAtUtc: null,
        endsAtUtc: null,
      };
    });
  }

  function selectBarber(id: string) {
    setState((p) => ({
      ...p,
      barberId: id,
      // Mudança de barbeiro invalida horário (slots de outro)
      time: null,
      startsAtUtc: null,
      endsAtUtc: null,
    }));
  }

  function selectSlot(date: string, slot: { time: string; startsAtUtc: string; endsAtUtc: string }) {
    setState((p) => ({
      ...p,
      date,
      time: slot.time,
      startsAtUtc: slot.startsAtUtc,
      endsAtUtc: slot.endsAtUtc,
    }));
  }

  function handleSuccess(id: string, cancelToken: string) {
    setSuccess({ id, cancelToken });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    }
  }

  // ----- Render -----
  if (success) {
    return (
      <BookingSuccess
        appointmentId={success.id}
        cancelToken={success.cancelToken}
        state={state}
        services={services}
        barbers={barbers}
        createdAccount={false}
      />
    );
  }

  const canAdvance =
    (step === "servicos" && state.serviceIds.length > 0) ||
    (step === "barbeiro" && !!state.barberId) ||
    (step === "horario" && !!state.startsAtUtc) ||
    step === "confirmar";

  const ctaLabel =
    step === "servicos"
      ? "Escolher barbeiro"
      : step === "barbeiro"
        ? "Escolher horário"
        : step === "horario"
          ? "Revisar e confirmar"
          : "Confirmar";

  return (
    <div className="space-y-10 pb-32 lg:pb-28">
      <Stepper current={step} reached={reachedIds} onJump={goTo} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === "servicos" && (
            <ServicePickerStep
              services={services}
              selected={state.serviceIds}
              onToggle={toggleService}
            />
          )}
          {step === "barbeiro" && (
            <BarberPickerStep
              barbers={barbers}
              selected={state.barberId}
              onSelect={selectBarber}
            />
          )}
          {step === "horario" && state.barberId && totalDuration > 0 && (
            <DateTimeStep
              barberId={state.barberId}
              durationMinutes={totalDuration}
              selectedDate={state.date}
              selectedTime={state.time}
              onSelectSlot={selectSlot}
            />
          )}
          {step === "confirmar" && (
            <ConfirmStep
              state={state}
              services={services}
              barbers={barbers}
              user={user}
              onSuccess={handleSuccess}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Botão "Voltar" — visível em telas largas inline; mobile fica no footer */}
      {stepIndex > 0 && (
        <div className="hidden md:flex">
          <Button type="button" variant="ghost" size="sm" onClick={prev}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </Button>
        </div>
      )}

      {/* Footer fixo só nos passos 1-3 */}
      {step !== "confirmar" && (
        <BookingSummaryBar
          services={selectedServices}
          canAdvance={canAdvance}
          ctaLabel={ctaLabel}
          onAdvance={next}
        />
      )}
    </div>
  );
}
