-- =============================================================================
-- Histórico de pagamentos dos mensalistas.
--   - Cada linha = um pagamento de uma assinatura
--   - method em texto livre (pix, dinheiro, cartão, etc.)
--   - RLS: cliente vê pagamentos da própria assinatura; staff lê/escreve tudo
-- =============================================================================

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.client_subscriptions(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  paid_at date not null default current_date,
  method text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists subscription_payments_sub_idx
  on public.subscription_payments (subscription_id, paid_at desc);

alter table public.subscription_payments enable row level security;

drop policy if exists sp_select_via_sub on public.subscription_payments;
create policy sp_select_via_sub on public.subscription_payments
  for select using (
    exists (
      select 1 from public.client_subscriptions cs
       where cs.id = subscription_id
         and (cs.profile_id = auth.uid() or public.is_staff())
    )
  );

drop policy if exists sp_staff_write on public.subscription_payments;
create policy sp_staff_write on public.subscription_payments
  for all using (public.is_staff()) with check (public.is_staff());
