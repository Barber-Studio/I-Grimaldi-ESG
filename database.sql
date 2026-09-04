-- =========================================================
-- I GRIMALDI E.S.G. - SUPABASE PATCH FINALE
-- ESEGUI TUTTO QUESTO FILE NEL SQL EDITOR DI SUPABASE
-- =========================================================

create extension if not exists pgcrypto;

-- PROFILI CLIENTI
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  customer_name text not null default '',
  customer_surname text not null default '',
  customer_phone text unique,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

-- APPUNTAMENTI
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  service_id text not null,
  service_name text not null,
  price numeric(10,2) not null default 0,
  appointment_date date not null,
  start_time time not null,
  end_time time,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now()
);

-- BLOCCHI AGENDA
create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  start_time time,
  all_day boolean not null default false,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Se le tabelle esistevano già, aggiunge le colonne necessarie
alter table public.profiles add column if not exists customer_name text not null default '';
alter table public.profiles add column if not exists customer_surname text not null default '';
alter table public.profiles add column if not exists customer_phone text;
alter table public.profiles add column if not exists role text not null default 'customer';

alter table public.appointments add column if not exists customer_id uuid references auth.users(id) on delete set null;
alter table public.appointments add column if not exists customer_name text;
alter table public.appointments add column if not exists customer_phone text;
alter table public.appointments add column if not exists service_id text;
alter table public.appointments add column if not exists service_name text;
alter table public.appointments add column if not exists price numeric(10,2) not null default 0;
alter table public.appointments add column if not exists appointment_date date;
alter table public.appointments add column if not exists start_time time;
alter table public.appointments add column if not exists end_time time;
alter table public.appointments add column if not exists status text not null default 'confirmed';

-- PROFILO AUTOMATICO QUANDO UN UTENTE SI REGISTRA
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_role text;
begin
  v_phone := regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''), '\D', '', 'g');

  if v_phone like '%3791415355' then
    v_role := 'admin';
  else
    v_role := 'customer';
  end if;

  insert into public.profiles (
    id,
    customer_name,
    customer_surname,
    customer_phone,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name',''),
    v_phone,
    v_role
  )
  on conflict (id) do update set
    customer_name = excluded.customer_name,
    customer_surname = excluded.customer_surname,
    customer_phone = excluded.customer_phone,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.blocked_slots enable row level security;

-- Elimina vecchie policy
drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles own insert" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
drop policy if exists "appointments read" on public.appointments;
drop policy if exists "appointments insert" on public.appointments;
drop policy if exists "appointments update" on public.appointments;
drop policy if exists "appointments delete" on public.appointments;
drop policy if exists "blocks read all" on public.blocked_slots;
drop policy if exists "blocks admin manage" on public.blocked_slots;

-- PROFILI
create policy "profiles own read"
on public.profiles for select
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "profiles own update"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- APPUNTAMENTI: cliente vede i propri, admin vede tutto
create policy "appointments read"
on public.appointments for select
using (
  customer_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "appointments insert"
on public.appointments for insert
with check (
  customer_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "appointments update"
on public.appointments for update
using (
  customer_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  customer_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "appointments delete"
on public.appointments for delete
using (
  customer_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- BLOCCHI: tutti leggono, solo admin modifica
create policy "blocks read all"
on public.blocked_slots for select
using (true);

create policy "blocks admin manage"
on public.blocked_slots for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Un solo appuntamento attivo per data + orario
create unique index if not exists one_active_slot
on public.appointments (appointment_date, start_time)
where status = 'confirmed';

-- Rende amministratore il numero indicato
update public.profiles
set role = 'admin'
where regexp_replace(coalesce(customer_phone,''), '\D', '', 'g') like '%3791415355';
