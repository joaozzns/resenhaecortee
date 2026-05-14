-- =============================================================================
-- Adiciona estado 'pending' (aguardando confirmação) em appointments.
--
-- Comportamento: novos agendamentos nascem como 'pending'; admin/barber
-- confirma manualmente no painel para virar 'confirmed'.
-- =============================================================================

alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('pending','confirmed','cancelled','completed','no_show'));

alter table public.appointments
  alter column status set default 'pending';
