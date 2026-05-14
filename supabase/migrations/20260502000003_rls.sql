-- =============================================================================
-- Row Level Security
-- Política de acesso por tabela. Toda escrita em appointments deve passar
-- pelo Route Handler com service role (que valida disponibilidade primeiro).
-- =============================================================================

alter table public.profiles               enable row level security;
alter table public.services               enable row level security;
alter table public.barbers                enable row level security;
alter table public.working_hours          enable row level security;
alter table public.time_blocks            enable row level security;
alter table public.appointments           enable row level security;
alter table public.appointment_services   enable row level security;
alter table public.loyalty_transactions   enable row level security;
alter table public.favorite_services      enable row level security;

-- profiles --------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- services (catálogo público) -------------------------------------------------
drop policy if exists services_select_public on public.services;
create policy services_select_public on public.services
  for select using (active = true or public.is_staff());

drop policy if exists services_admin_write on public.services;
create policy services_admin_write on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- barbers (catálogo público) --------------------------------------------------
drop policy if exists barbers_select_public on public.barbers;
create policy barbers_select_public on public.barbers
  for select using (active = true or public.is_staff());

drop policy if exists barbers_admin_write on public.barbers;
create policy barbers_admin_write on public.barbers
  for all using (public.is_admin()) with check (public.is_admin());

-- working_hours: leitura pública (necessária para a página de agendamento) ----
drop policy if exists wh_select_public on public.working_hours;
create policy wh_select_public on public.working_hours for select using (true);

drop policy if exists wh_admin_write on public.working_hours;
create policy wh_admin_write on public.working_hours
  for all using (public.is_admin()) with check (public.is_admin());

-- time_blocks: leitura pública (cliente precisa para ver slots indisponíveis)
-- Não expomos o campo `reason` no app — apenas usado server-side. Se virar
-- problema, dá pra criar uma view sanitizada.
drop policy if exists tb_select_public on public.time_blocks;
create policy tb_select_public on public.time_blocks for select using (true);

drop policy if exists tb_staff_write on public.time_blocks;
create policy tb_staff_write on public.time_blocks
  for all using (public.is_staff()) with check (public.is_staff());

-- appointments ----------------------------------------------------------------
-- Cliente lê apenas os próprios; staff lê tudo.
drop policy if exists appts_client_select on public.appointments;
create policy appts_client_select on public.appointments
  for select using (client_id = auth.uid() or public.is_staff());

-- Cliente pode atualizar status do próprio agendamento (cancelar).
-- Validação adicional é feita no app (antecedência mínima).
drop policy if exists appts_client_update on public.appointments;
create policy appts_client_update on public.appointments
  for update using (client_id = auth.uid()) with check (client_id = auth.uid());

drop policy if exists appts_staff_all on public.appointments;
create policy appts_staff_all on public.appointments
  for all using (public.is_staff()) with check (public.is_staff());

-- INSERT é proibido para usuários comuns — agendamentos só nascem via
-- Route Handler usando service role key (após validar disponibilidade).
-- Não criamos policy de INSERT propositalmente.

-- appointment_services -------------------------------------------------------
drop policy if exists as_select_via_appt on public.appointment_services;
create policy as_select_via_appt on public.appointment_services
  for select using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (a.client_id = auth.uid() or public.is_staff())
    )
  );

drop policy if exists as_staff_write on public.appointment_services;
create policy as_staff_write on public.appointment_services
  for all using (public.is_staff()) with check (public.is_staff());

-- loyalty_transactions -------------------------------------------------------
drop policy if exists lt_select_own on public.loyalty_transactions;
create policy lt_select_own on public.loyalty_transactions
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists lt_admin_write on public.loyalty_transactions;
create policy lt_admin_write on public.loyalty_transactions
  for all using (public.is_admin()) with check (public.is_admin());

-- favorite_services ----------------------------------------------------------
drop policy if exists fs_select_own on public.favorite_services;
create policy fs_select_own on public.favorite_services
  for select using (profile_id = auth.uid());

drop policy if exists fs_write_own on public.favorite_services;
create policy fs_write_own on public.favorite_services
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
