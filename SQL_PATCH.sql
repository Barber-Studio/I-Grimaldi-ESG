-- ESEGUI SOLO SE LE COLONNE MANCANO NELLA TUA TABELLA appointments
-- Il progetto usa:
-- profiles: id, customer_name, customer_phone, customer_pin, role
-- appointments: id, client_id, client_name, client_phone,
-- appointment_date, appointment_time, service, price, status

alter table public.appointments add column if not exists client_id uuid;
alter table public.appointments add column if not exists client_name text;
alter table public.appointments add column if not exists client_phone text;
alter table public.appointments add column if not exists appointment_date date;
alter table public.appointments add column if not exists appointment_time text;
alter table public.appointments add column if not exists service text;
alter table public.appointments add column if not exists price numeric;
alter table public.appointments add column if not exists status text default 'confirmed';

-- Se RLS è attivo e la tua app non riesce a leggere/scrivere,
-- configura le policy appropriate nel dashboard Supabase.
