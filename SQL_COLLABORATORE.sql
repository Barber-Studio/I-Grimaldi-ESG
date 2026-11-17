-- I GRIMALDI - COLLABORATORE
-- Esegui UNA VOLTA in Supabase > SQL Editor, PRIMA di caricare il nuovo js/app.js.
-- Permette di prenotare la stessa fascia oraria due volte:
-- una per il titolare e una per il collaboratore.

-- 1. Nuova colonna: a chi è assegnato l'appuntamento (quelli già esistenti restano al titolare)
alter table public.appointments
  add column if not exists staff text not null default 'titolare';

-- 2. Rimuove il vincolo "un solo cliente per data+ora" (qualunque nome abbia)
do $$
declare r record;
begin
  for r in
    select ic.relname as index_name, con.conname as constraint_name
    from pg_index i
    join pg_class ic on ic.oid = i.indexrelid
    left join pg_constraint con on con.conindid = i.indexrelid and con.contype = 'u'
    where i.indrelid = 'public.appointments'::regclass
      and i.indisunique
      and not i.indisprimary
      and (
        select array_agg(a.attname::text order by a.attname)
        from pg_attribute a
        where a.attrelid = i.indrelid and a.attnum = any(i.indkey)
      ) = array['appointment_date','start_time']
  loop
    if r.constraint_name is not null then
      execute format('alter table public.appointments drop constraint %I', r.constraint_name);
    else
      execute format('drop index public.%I', r.index_name);
    end if;
  end loop;
end $$;

-- 3. Nuovo vincolo: un solo cliente per data+ora+persona
create unique index if not exists appointments_unique_active_slot_staff
on public.appointments(appointment_date, start_time, staff)
where status = 'confirmed';
