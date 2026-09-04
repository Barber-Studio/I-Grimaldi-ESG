-- I GRIMALDI - DATABASE DEFINITIVO
-- ATTENZIONE: questo script ricrea le tabelle dell'app.
-- Usalo nel SQL Editor di Supabase.

drop table if exists public.appointments cascade;
drop table if exists public.profiles cascade;

create extension if not exists pgcrypto;

create table public.profiles (
 id uuid primary key default gen_random_uuid(),
 customer_name text not null,
 customer_phone text not null unique,
 customer_pin text not null,
 role text not null default 'customer',
 created_at timestamptz not null default now()
);

create table public.appointments (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.profiles(id) on delete cascade,
 client_name text not null,
 client_phone text not null,
 appointment_date date not null,
 appointment_time time not null,
 service text not null,
 price numeric(10,2) not null,
 status text not null default 'confirmed',
 created_at timestamptz not null default now(),
 unique(appointment_date, appointment_time)
);

alter table public.profiles enable row level security;
alter table public.appointments enable row level security;

create policy "public profiles read" on public.profiles for select to anon, authenticated using (true);
create policy "public profiles insert" on public.profiles for insert to anon, authenticated with check (true);
create policy "public profiles update" on public.profiles for update to anon, authenticated using (true) with check (true);

create policy "public appointments read" on public.appointments for select to anon, authenticated using (true);
create policy "public appointments insert" on public.appointments for insert to anon, authenticated with check (true);
create policy "public appointments delete" on public.appointments for delete to anon, authenticated using (true);

-- L'admin viene impostato automaticamente quando registri questo numero.
-- Dopo la registrazione esegui:
-- update public.profiles set role='admin' where customer_phone='3791415355';
