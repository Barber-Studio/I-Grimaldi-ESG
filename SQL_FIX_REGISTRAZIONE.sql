-- I GRIMALDI - FIX REGISTRAZIONE DEFINITIVO
-- ESEGUI QUESTO FILE NEL SQL EDITOR DI SUPABASE

create extension if not exists pgcrypto;

-- Crea o completa la tabella profiles anche se esiste già
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid()
);

alter table public.profiles add column if not exists customer_name text;
alter table public.profiles add column if not exists customer_phone text;
alter table public.profiles add column if not exists customer_pin text;
alter table public.profiles add column if not exists role text default 'customer';
alter table public.profiles add column if not exists created_at timestamptz default now();

-- Rende obbligatori i dati necessari per la nuova registrazione
alter table public.profiles alter column customer_name set not null;
alter table public.profiles alter column customer_phone set not null;
alter table public.profiles alter column customer_pin set not null;

-- Elimina eventuali indici/policy vecchie incompatibili
drop index if exists public.profiles_customer_phone_unique;
create unique index if not exists profiles_customer_phone_unique
on public.profiles(customer_phone);

create table if not exists public.appointments (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.profiles(id) on delete cascade,
 client_name text not null,
 client_phone text not null,
 appointment_date date not null,
 appointment_time time not null,
 service text not null,
 price numeric(10,2) not null,
 status text not null default 'confirmed',
 created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.appointments enable row level security;

-- Rimuove TUTTE le policy usate dalle patch precedenti
drop policy if exists "profiles_public_select" on public.profiles;
drop policy if exists "profiles_public_insert" on public.profiles;
drop policy if exists "profiles_public_update" on public.profiles;
drop policy if exists "profiles_all_select" on public.profiles;
drop policy if exists "profiles_all_insert" on public.profiles;
drop policy if exists "profiles_all_update" on public.profiles;

drop policy if exists "appointments_public_select" on public.appointments;
drop policy if exists "appointments_public_insert" on public.appointments;
drop policy if exists "appointments_public_delete" on public.appointments;

-- Policy necessarie all'app senza Supabase Auth
create policy "profiles_public_select"
on public.profiles for select
to anon, authenticated
using (true);

create policy "profiles_public_insert"
on public.profiles for insert
to anon, authenticated
with check (true);

create policy "profiles_public_update"
on public.profiles for update
to anon, authenticated
using (true)
with check (true);

create policy "appointments_public_select"
on public.appointments for select
to anon, authenticated
using (true);

create policy "appointments_public_insert"
on public.appointments for insert
to anon, authenticated
with check (true);

create policy "appointments_public_delete"
on public.appointments for delete
to anon, authenticated
using (true);

-- Admin
update public.profiles
set role='admin'
where regexp_replace(customer_phone,'[^0-9]','','g')='3791415355';
