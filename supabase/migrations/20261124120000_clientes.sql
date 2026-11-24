-- Clientes de cada usuario. Cada usuario solo ve y modifica sus propios
-- clientes: el aislamiento lo garantiza RLS (D4).

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  nombre text not null,
  empresa text,
  email text,
  telefono text,
  notas text,
  created_at timestamptz not null default now(),

  -- Los mismos límites que el formulario (src/lib/validacion/cliente.ts).
  constraint clientes_nombre_longitud
    check (char_length(btrim(nombre)) between 2 and 100),
  constraint clientes_empresa_longitud check (char_length(empresa) <= 100),
  constraint clientes_email_longitud check (char_length(email) <= 254),
  constraint clientes_telefono_longitud check (char_length(telefono) <= 30),
  constraint clientes_notas_longitud check (char_length(notas) <= 2000)
);

create index clientes_owner_id_idx on public.clientes (owner_id);

alter table public.clientes enable row level security;

grant select, insert, update, delete on table public.clientes to authenticated;

create policy "clientes: cada usuario ve los suyos"
  on public.clientes for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "clientes: cada usuario crea los suyos"
  on public.clientes for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "clientes: cada usuario edita los suyos"
  on public.clientes for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "clientes: cada usuario borra los suyos"
  on public.clientes for delete
  to authenticated
  using (owner_id = (select auth.uid()));
