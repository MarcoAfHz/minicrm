-- Oportunidades de venta de cada usuario, siempre asociadas a uno de SUS
-- clientes. El aislamiento lo garantiza RLS (D4).

create table public.oportunidades (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  cliente_id uuid not null
    references public.clientes (id) on delete cascade,
  titulo text not null,
  importe numeric(12, 2) not null default 0,
  etapa text not null default 'nuevo',
  fecha_cierre_prevista date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Los mismos límites que el formulario (src/lib/validacion/oportunidad.ts).
  constraint oportunidades_titulo_longitud
    check (char_length(btrim(titulo)) between 2 and 120),
  constraint oportunidades_importe_no_negativo check (importe >= 0),
  -- Las mismas etapas que src/lib/embudo.ts.
  constraint oportunidades_etapa_valida
    check (etapa in ('nuevo', 'contactado', 'propuesta', 'ganada', 'perdida'))
);

create index oportunidades_owner_id_idx on public.oportunidades (owner_id);
create index oportunidades_cliente_id_idx on public.oportunidades (cliente_id);

-- updated_at se actualiza solo en cada cambio de la fila.
create function public.actualizar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger oportunidades_updated_at
  before update on public.oportunidades
  for each row
  execute function public.actualizar_updated_at();

alter table public.oportunidades enable row level security;

grant select, insert, update, delete on table public.oportunidades to authenticated;

create policy "oportunidades: cada usuario ve las suyas"
  on public.oportunidades for select
  to authenticated
  using (owner_id = (select auth.uid()));

-- La clave foránea solo comprueba que el cliente exista, no de quién es: sin
-- el `exists`, un usuario podría colgar una oportunidad de un cliente ajeno.
create policy "oportunidades: cada usuario crea las suyas"
  on public.oportunidades for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.clientes c
      where c.id = oportunidades.cliente_id
        and c.owner_id = (select auth.uid())
    )
  );

create policy "oportunidades: cada usuario edita las suyas"
  on public.oportunidades for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.clientes c
      where c.id = oportunidades.cliente_id
        and c.owner_id = (select auth.uid())
    )
  );

create policy "oportunidades: cada usuario borra las suyas"
  on public.oportunidades for delete
  to authenticated
  using (owner_id = (select auth.uid()));
