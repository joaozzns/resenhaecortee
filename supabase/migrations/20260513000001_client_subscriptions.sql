-- =============================================================================
-- Mensalistas (planos recorrentes do cliente).
--   - Cada linha = um cliente vinculado a um plano (com nome livre)
--   - status: active | paused | cancelled
--   - RLS: cliente vê o próprio; staff lê/escreve tudo
-- =============================================================================

create table if not exists public.client_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text not null,
  price_cents integer not null default 0,
  started_at date not null default current_date,
  status text not null check (status in ('active','paused','cancelled')) default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_subscriptions_profile_idx
  on public.client_subscriptions (profile_id);
create index if not exists client_subscriptions_status_idx
  on public.client_subscriptions (status);

alter table public.client_subscriptions enable row level security;

drop policy if exists cs_select_own on public.client_subscriptions;
create policy cs_select_own on public.client_subscriptions
  for select using (profile_id = auth.uid() or public.is_staff());

drop policy if exists cs_staff_write on public.client_subscriptions;
create policy cs_staff_write on public.client_subscriptions
  for all using (public.is_staff()) with check (public.is_staff());

drop trigger if exists client_subscriptions_set_updated_at on public.client_subscriptions;
create trigger client_subscriptions_set_updated_at
  before update on public.client_subscriptions
  for each row execute function public.set_updated_at();
