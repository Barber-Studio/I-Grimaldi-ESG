-- I GRIMALDI E.S.G. - PATCH DATABASE COMPLETA
-- ESEGUI TUTTO IN SUPABASE > SQL EDITOR

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  customer_name text not null default '',
  customer_surname text not null default '',
  customer_phone text unique,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

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

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  start_time time,
  all_day boolean not null default false,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.blocked_slots enable row level security;

drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles own insert" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own read" on public.profiles for select using (auth.uid()=id or (select role from public.profiles where id=auth.uid())='admin');
create policy "profiles own insert" on public.profiles for insert with check (auth.uid()=id);
create policy "profiles own update" on public.profiles for update using (auth.uid()=id);

drop policy if exists "appointments read" on public.appointments;
drop policy if exists "appointments insert" on public.appointments;
drop policy if exists "appointments update" on public.appointments;
create policy "appointments read" on public.appointments for select using (customer_id=auth.uid() or (select role from public.profiles where id=auth.uid())='admin');
create policy "appointments insert" on public.appointments for insert with check (customer_id=auth.uid() or (select role from public.profiles where id=auth.uid())='admin');
create policy "appointments update" on public.appointments for update using (customer_id=auth.uid() or (select role from public.profiles where id=auth.uid())='admin');

drop policy if exists "blocks read all" on public.blocked_slots;
drop policy if exists "blocks admin manage" on public.blocked_slots;
create policy "blocks read all" on public.blocked_slots for select using (true);
create policy "blocks admin manage" on public.blocked_slots for all using ((select role from public.profiles where id=auth.uid())='admin') with check ((select role from public.profiles where id=auth.uid())='admin');

-- IMPORTANTE: dopo aver creato il tuo account, rendilo amministratore.
-- Sostituisci IL_TUO_NUMERO con il numero senza spazi, prefisso o simboli.
-- Esempio:
-- update public.profiles set role='admin' where customer_phone='3331234567';

create unique index if not exists one_active_slot
on public.appointments (appointment_date,start_time)
where status='confirmed';