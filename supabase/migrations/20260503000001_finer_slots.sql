-- =============================================================================
-- Granularidade de slots reduzida para 15 minutos.
--
-- Permite serviços rápidos (15 min: Freestyle, Sobrancelha) e intermediários
-- (45 min: Relaxamento) sem desperdiçar espaço na agenda.
--
-- Idempotente — pode rodar de novo sem quebrar.
-- =============================================================================

alter table public.services
  drop constraint if exists services_duration_minutes_check;

alter table public.services
  add constraint services_duration_minutes_check
  check (duration_minutes > 0 and duration_minutes % 15 = 0);
