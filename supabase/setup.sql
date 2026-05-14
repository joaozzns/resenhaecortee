-- =============================================================================
-- Resenha e Corte — setup.sql (concat de todas as migrations)
-- Cole este arquivo inteiro no Supabase SQL Editor e execute uma vez.
-- Idempotente — pode rodar de novo sem quebrar.
-- =============================================================================

-- =============================================================================
-- Resenha e Corte — Schema inicial
-- Tabelas: profiles, services, barbers, working_hours, time_blocks,
--          appointments, appointment_services, loyalty_transactions,
--          favorite_services
-- Idempotente — pode rodar de novo sem quebrar.
-- =============================================================================

create extension if not exists "pgcrypto";

-- profiles ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('client','barber','admin')) default 'client',
  full_name text,
  phone text,
  birthdate date,
  avatar_url text,
  notification_email boolean not null default true,
  notification_whatsapp boolean not null default true,
  favorite_barber_id uuid,
  loyalty_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- services --------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes % 30 = 0),
  price_cents integer not null check (price_cents >= 0),
  category text not null check (category in ('cabelo','barba','combo','tratamento')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists services_active_idx on public.services (active, sort_order);
-- garante UNIQUE para upsert do seed mesmo em DBs preexistentes
alter table public.services drop constraint if exists services_name_key;
alter table public.services add constraint services_name_key unique (name);

-- barbers ---------------------------------------------------------------------
create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null unique,
  bio text,
  photo_url text,
  specialties text[] not null default '{}',
  instagram text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists barbers_active_idx on public.barbers (active, sort_order);
alter table public.barbers drop constraint if exists barbers_name_key;
alter table public.barbers add constraint barbers_name_key unique (name);

-- Now that barbers exists, link favorite_barber_id
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'profiles_favorite_barber_fk'
  ) then
    alter table public.profiles
      add constraint profiles_favorite_barber_fk
      foreign key (favorite_barber_id) references public.barbers(id) on delete set null;
  end if;
end $$;

-- working_hours: por barbeiro, por dia da semana ------------------------------
create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  constraint working_hours_valid_range check (end_time > start_time),
  unique (barber_id, weekday, start_time)
);
create index if not exists working_hours_barber_weekday_idx
  on public.working_hours (barber_id, weekday);

-- time_blocks: folgas, almoço, bloqueios pontuais ------------------------------
create table if not exists public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint time_blocks_valid_range check (ends_at > starts_at)
);
create index if not exists time_blocks_barber_range_idx
  on public.time_blocks (barber_id, starts_at, ends_at);

-- appointments ----------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete set null,
  -- snapshot do cliente, sempre preenchido (cobre o caso guest)
  client_name text not null,
  client_phone text not null,
  client_email text not null,
  barber_id uuid not null references public.barbers(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (status in ('confirmed','cancelled','completed','no_show')) default 'confirmed',
  cancel_token uuid not null default gen_random_uuid(),
  total_cents integer not null default 0,
  notes text,
  rating integer check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint appointments_valid_range check (ends_at > starts_at)
);
-- Índice usado para checagem de disponibilidade (apenas slots ainda válidos)
create index if not exists appointments_barber_range_idx
  on public.appointments (barber_id, starts_at, ends_at)
  where status <> 'cancelled';
create index if not exists appointments_client_idx
  on public.appointments (client_id, starts_at desc);
create unique index if not exists appointments_cancel_token_idx
  on public.appointments (cancel_token);

-- appointment_services: n:n com snapshot de preço/duração ---------------------
create table if not exists public.appointment_services (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  price_cents integer not null,
  duration_minutes integer not null,
  primary key (appointment_id, service_id)
);

-- loyalty_transactions --------------------------------------------------------
create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  points integer not null,  -- positivo = ganho, negativo = resgate
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists loyalty_profile_idx
  on public.loyalty_transactions (profile_id, created_at desc);

-- favorite_services -----------------------------------------------------------
create table if not exists public.favorite_services (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, service_id)
);

-- updated_at trigger genérico --------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Triggers e helpers
-- =============================================================================

-- Cria automaticamente um row em public.profiles para todo usuário novo
-- em auth.users. SECURITY DEFINER para conseguir gravar mesmo com RLS ligado.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers de role usados nas policies. SECURITY DEFINER + STABLE para evitar
-- recursão de RLS (quem checa role precisa ler profiles, mas profiles tem RLS).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','barber')
  );
$$;

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
