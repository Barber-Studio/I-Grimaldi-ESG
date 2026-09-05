-- PATCH GESTIONE AGENDA COMPLETA I GRIMALDI
-- Esegui una sola volta nel SQL Editor di Supabase.

create table if not exists public.availability_blocks (
 id uuid primary key default gen_random_uuid(),
 block_date date not null,
 block_time text not null default 'ALL',
 created_at timestamptz not null default now(),
 unique(block_date, block_time)
);

alter table public.availability_blocks enable row level security;

drop policy if exists "blocks_select_public" on public.availability_blocks;
drop policy if exists "blocks_insert_public" on public.availability_blocks;
drop policy if exists "blocks_delete_public" on public.availability_blocks;
create policy "blocks_select_public" on public.availability_blocks for select to anon, authenticated using (true);
create policy "blocks_insert_public" on public.availability_blocks for insert to anon, authenticated with check (true);
create policy "blocks_delete_public" on public.availability_blocks for delete to anon, authenticated using (true);

drop policy if exists "appointments_update_public" on public.appointments;
create policy "appointments_update_public" on public.appointments for update to anon, authenticated using (true) with check (true);

update public.profiles set role='admin' where regexp_replace(customer_phone, '[^0-9]', '', 'g')='3791415355';
