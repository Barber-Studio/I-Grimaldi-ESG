-- I GRIMALDI E.S.G. - PATCH AGENDA COMPLETA
-- Esegui questo file nel SQL Editor di Supabase.
-- Non cambia la grafica. Aggiunge solo ciò che serve al database.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key default gen_random_uuid(),
 customer_name text not null,
 customer_phone text not null unique,
 customer_pin text not null,
 role text not null default 'customer',
 created_at timestamptz not null default now()
);

create table if not exists public.appointments (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null,
 client_name text not null,
 client_phone text not null,
 appointment_date date not null,
 appointment_time time not null,
 service text not null,
 price numeric(10,2) not null default 0,
 status text not null default 'confirmed',
 created_at timestamptz not null default now(),
 unique(appointment_date, appointment_time)
);

create table if not exists public.availability_blocks (
 id uuid primary key default gen_random_uuid(),
 block_date date not null,
 block_time text not null default 'ALL',
 created_at timestamptz not null default now(),
 unique(block_date, block_time)
);

alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.availability_blocks enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_insert_public" on public.profiles;
drop policy if exists "appointments_select_public" on public.appointments;
drop policy if exists "appointments_insert_public" on public.appointments;
drop policy if exists "appointments_delete_public" on public.appointments;
drop policy if exists "blocks_select_public" on public.availability_blocks;
drop policy if exists "blocks_insert_public" on public.availability_blocks;
drop policy if exists "blocks_delete_public" on public.availability_blocks;

create policy "profiles_select_public" on public.profiles for select to anon, authenticated using (true);
create policy "profiles_insert_public" on public.profiles for insert to anon, authenticated with check (true);
create policy "appointments_select_public" on public.appointments for select to anon, authenticated using (true);
create policy "appointments_insert_public" on public.appointments for insert to anon, authenticated with check (true);
create policy "appointments_delete_public" on public.appointments for delete to anon, authenticated using (true);
create policy "blocks_select_public" on public.availability_blocks for select to anon, authenticated using (true);
create policy "blocks_insert_public" on public.availability_blocks for insert to anon, authenticated with check (true);
create policy "blocks_delete_public" on public.availability_blocks for delete to anon, authenticated using (true);

-- Imposta il tuo numero come amministratore.
update public.profiles
set role='admin'
where regexp_replace(customer_phone, '[^0-9]', '', 'g')='3791415355';
