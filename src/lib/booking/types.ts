import type { Tables } from "@/lib/supabase/types";

export type Service = Tables<"services">;
export type Barber = Tables<"barbers">;

export type StepId = "servicos" | "barbeiro" | "horario" | "confirmar";
export const STEPS: Array<{ id: StepId; label: string }> = [
  { id: "servicos", label: "Serviços" },
  { id: "barbeiro", label: "Barbeiro" },
  { id: "horario", label: "Data e horário" },
  { id: "confirmar", label: "Confirmar" },
];

export type BookingState = {
  serviceIds: string[];
  barberId: string | null; // 'any' | uuid | null
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:MM (BR)
  startsAtUtc: string | null; // ISO UTC
  endsAtUtc: string | null;
};

export const EMPTY_STATE: BookingState = {
  serviceIds: [],
  barberId: null,
  date: null,
  time: null,
  startsAtUtc: null,
  endsAtUtc: null,
};
