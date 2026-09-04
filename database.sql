-- =====================================================
-- I GRIMALDI E.S.G. - DATABASE DEFINITIVO E SICURO
-- ESEGUI UNA VOLTA SOLA IN SUPABASE > SQL EDITOR
-- =====================================================

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  customer_name text not null default '',
  customer_surname text not null default '',
  customer_phone text,
  role text not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null default '',
  customer_phone text,
  service_id text not null default '',
  service_name text not null default '',
  price numeric(10,2) not null default 0,
  appointment_date date not null,
  start_time time not null,
  end_time time,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  start_time time,
  all_day boolean not null default false,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists customer_name text not null default '';
alter table public.profiles add column if not exists customer_surname text not null default '';
alter table public.profiles add column if not exists customer_phone text;
alter table public.profiles add column if not exists role text not null default 'customer';

alter table public.appointments add column if not exists customer_id uuid references auth.users(id) on delete set null;
alter table public.appointments add column if not exists customer_name text not null default '';
alter table public.appointments add column if not exists customer_phone text;
alter table public.appointments add column if not exists service_id text not null default '';
alter table public.appointments add column if not exists service_name text not null default '';
alter table public.appointments add column if not exists price numeric(10,2) not null default 0;
alter table public.appointments add column if not exists appointment_date date;
alter table public.appointments add column if not exists start_time time;
alter table public.appointments add column if not exists end_time time;
alter table public.appointments add column if not exists status text not null default 'confirmed';

-- FUNZIONE ADMIN: evita il problema di ricorsione RLS
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

-- PROFILO AUTOMATICO ALLA REGISTRAZIONE
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
  v_phone := regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''), '[^0-9]', '', 'g');
  v_role := case when right(v_phone,10) = '3791415355' then 'admin' else 'customer' end;

  insert into public.profiles(id,customer_name,customer_surname,customer_phone,role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name',''),
    v_phone,
    v_role
  )
  on conflict (id) do update set
    customer_name=excluded.customer_name,
    customer_surname=excluded.customer_surname,
    customer_phone=excluded.customer_phone,
    role=excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.blocked_slots enable row level security;

-- Rimuove tutte le policy vecchie per evitare conflitti
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;

drop policy if exists "appointments_select" on public.appointments;
drop policy if exists "appointments_insert" on public.appointments;
drop policy if exists "appointments_update" on public.appointments;
drop policy if exists "appointments_delete" on public.appointments;
drop policy if exists "appointments read" on public.appointments;
drop policy if exists "appointments insert" on public.appointments;
drop policy if exists "appointments update" on public.appointments;
drop policy if exists "appointments delete" on public.appointments;

drop policy if exists "blocks_select" on public.blocked_slots;
drop policy if exists "blocks_manage" on public.blocked_slots;
drop policy if exists "blocks read all" on public.blocked_slots;
drop policy if exists "blocks admin manage" on public.blocked_slots;

-- PROFILI
create policy "profiles_select" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_update" on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "profiles_insert" on public.profiles
for insert to authenticated
with check (id = auth.uid() or public.is_admin());

-- APPUNTAMENTI
create policy "appointments_select" on public.appointments
for select to authenticated
using (customer_id = auth.uid() or public.is_admin());

create policy "appointments_insert" on public.appointments
for insert to authenticated
with check (customer_id = auth.uid() or public.is_admin());

create policy "appointments_update" on public.appointments
for update to authenticated
using (customer_id = auth.uid() or public.is_admin())
with check (customer_id = auth.uid() or public.is_admin());

create policy "appointments_delete" on public.appointments
for delete to authenticated
using (customer_id = auth.uid() or public.is_admin());

-- BLOCCHI
create policy "blocks_select" on public.blocked_slots
for select to authenticated
using (true);

create policy "blocks_manage" on public.blocked_slots
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Indici
create index if not exists appointments_customer_id_idx on public.appointments(customer_id);
create index if not exists appointments_date_idx on public.appointments(appointment_date);
create index if not exists blocked_slots_date_idx on public.blocked_slots(blocked_date);

-- Un solo cliente per ogni fascia oraria
create unique index if not exists appointments_unique_active_slot
on public.appointments(appointment_date,start_time)
where status = 'confirmed';

-- ADMIN
update public.profiles
set role='admin'
where right(regexp_replace(coalesce(customer_phone,''),'[^0-9]','','g'),10)='3791415355';
