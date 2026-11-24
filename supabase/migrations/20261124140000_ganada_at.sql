-- Fecha en que cada oportunidad pasó a «ganada». El panel la usa para
-- «Ganado este mes»: a diferencia de updated_at, no cambia al editar otros
-- campos de una oportunidad que ya estaba ganada.

alter table public.oportunidades
  add column ganada_at timestamptz;

-- Backfill de las oportunidades que ya estaban ganadas. No hay un dato mejor
-- que updated_at, así que se toma como aproximación solo para estas filas.
-- Orden:
--  1. Se hace ANTES de crear el trigger de ganada_at: si existiera, vería
--     «ganada → ganada» y conservaría el valor anterior (null), deshaciendo el
--     backfill.
--  2. Se desactiva el trigger de updated_at mientras tanto: si no, pondría
--     updated_at = now() en todas estas filas. (En el SET, `updated_at` ya
--     lee el valor anterior a cualquier trigger, pero la fila quedaría
--     «modificada» hoy sin que nadie la haya tocado.)
alter table public.oportunidades disable trigger oportunidades_updated_at;

update public.oportunidades
  set ganada_at = updated_at
  where etapa = 'ganada';

alter table public.oportunidades enable trigger oportunidades_updated_at;

-- ganada_at lo gestiona solo la base de datos; se ignora lo que envíe el
-- cliente en el insert o en el update:
--  - pasa a «ganada» (insert, o venía de otra etapa) → now();
--  - sigue en «ganada» → conserva el valor anterior;
--  - cualquier otra etapa → null.
create function public.actualizar_ganada_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.etapa = 'ganada' then
    if tg_op = 'INSERT' or old.etapa is distinct from 'ganada' then
      new.ganada_at = now();
    else
      new.ganada_at = old.ganada_at;
    end if;
  else
    new.ganada_at = null;
  end if;
  return new;
end;
$$;

create trigger oportunidades_ganada_at
  before insert or update on public.oportunidades
  for each row
  execute function public.actualizar_ganada_at();
