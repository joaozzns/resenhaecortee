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
