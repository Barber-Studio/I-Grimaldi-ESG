-- I GRIMALDI - PATCH DATABASE UNICA
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key default gen_random_uuid(),
 customer_name text not null,
 customer_phone text not null unique,
 customer_pin text not null,
 role text not null default 'customer',
 created_at timestamptz default now()
);

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
 created_at timestamptz default now(),
 unique(appointment_date, appointment_time)
);

alter table public.profiles enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "profiles_public_select" on public.profiles;
drop policy if exists "profiles_public_insert" on public.profiles;
drop policy if exists "profiles_public_update" on public.profiles;
drop policy if exists "appointments_public_select" on public.appointments;
drop policy if exists "appointments_public_insert" on public.appointments;
drop policy if exists "appointments_public_delete" on public.appointments;

create policy "profiles_public_select" on public.profiles for select to anon, authenticated using (true);
create policy "profiles_public_insert" on public.profiles for insert to anon, authenticated with check (true);
create policy "profiles_public_update" on public.profiles for update to anon, authenticated using (true) with check (true);
create policy "appointments_public_select" on public.appointments for select to anon, authenticated using (true);
create policy "appointments_public_insert" on public.appointments for insert to anon, authenticated with check (true);
create policy "appointments_public_delete" on public.appointments for delete to anon, authenticated using (true);

update public.profiles set role='admin' where regexp_replace(customer_phone,'[^0-9]','','g')='3791415355';
