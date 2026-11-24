-- Datos de demostración para el usuario de prueba demo@minicrm.app.
--
-- Cómo se aplica (lo hace el humano, no la app):
--   npx supabase db push --remote --include-seed
--
-- Qué hace:
--  - Busca el usuario por email en auth.users. Si no existe, avisa con un
--    NOTICE y no toca nada (primero hay que crearlo en Supabase Auth).
--  - Si existe, borra SUS clientes (el `on delete cascade` borra sus
--    oportunidades) y vuelve a crear los datos de ejemplo. Se puede ejecutar
--    tantas veces como se quiera: siempre deja el mismo resultado.
--  - No lee ni modifica datos de ningún otro usuario: todo va filtrado o
--    escrito con el owner_id del usuario de prueba.
--
-- Se ejecuta con el rol postgres, sin sesión de usuario: auth.uid() es null y
-- RLS no se aplica. Por eso owner_id se fija siempre de forma explícita.
--
-- Todas las fechas son relativas al día en que se ejecuta, en hora de Madrid
-- (la misma zona horaria que usa la app), para que el panel siempre tenga
-- oportunidades vencidas, próximos cierres y ganadas de este mes.
--
-- Todo va en un único bloque `do`, que es una sola sentencia: si algo falla,
-- no se aplica nada (tampoco la desactivación temporal de los triggers).

do $$
declare
  v_owner uuid;
  -- «Hoy» y el comienzo del mes en Madrid, como en src/lib/metricas.ts.
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_inicio_mes timestamptz :=
    date_trunc('month', now() at time zone 'Europe/Madrid')
      at time zone 'Europe/Madrid';
  c_obrador uuid;
  c_talleres uuid;
  c_clinica uuid;
  c_asesores uuid;
  c_hotel uuid;
  c_ferreteria uuid;
  c_arquitectura uuid;
  c_fisio uuid;
begin
  select id into v_owner
  from auth.users
  where email = 'demo@minicrm.app';

  if v_owner is null then
    raise notice 'No existe el usuario demo@minicrm.app en auth.users. Créalo en Supabase Auth y vuelve a ejecutar el seed. No se ha cambiado nada.';
    return;
  end if;

  -- 1. Borrar los datos anteriores del usuario de prueba (y solo los suyos).
  delete from public.clientes where owner_id = v_owner;

  -- 2. Clientes. Emails con dominios .example y teléfonos ficticios.
  insert into public.clientes (owner_id, nombre, empresa, email, telefono, notas, created_at)
  values (v_owner, 'Lucía Fernández Ortega', 'Obrador Lucía', 'lucia@obradorlucia.example', '+34 600 000 101',
          'Panadería artesana con dos tiendas en Valencia. Quiere vender por internet para recoger en tienda.',
          now() - interval '140 days')
  returning id into c_obrador;

  insert into public.clientes (owner_id, nombre, empresa, email, telefono, notas, created_at)
  values (v_owner, 'Javier Morales Prieto', 'Talleres Morales e Hijos, S.L.', 'javier@talleresmorales.example', '+34 600 000 102',
          'Taller mecánico familiar. Prefiere que le llamen por la mañana.',
          now() - interval '120 days')
  returning id into c_talleres;

  insert into public.clientes (owner_id, nombre, empresa, email, telefono, notas, created_at)
  values (v_owner, 'Marta Gil Romero', 'Clínica Dental Sonrisa', 'marta.gil@clinicasonrisa.example', '+34 600 000 103',
          null,
          now() - interval '95 days')
  returning id into c_clinica;

  insert into public.clientes (owner_id, nombre, empresa, email, telefono, notas, created_at)
  values (v_owner, 'Andrés Navarro Sanz', 'Navarro Asesores', 'andres@navarroasesores.example', '+34 600 000 104',
          'Asesoría fiscal y laboral con unos 300 clientes. Decide junto a su socia, Pilar.',
          now() - interval '80 days')
  returning id into c_asesores;

  insert into public.clientes (owner_id, nombre, empresa, email, telefono, notas, created_at)
  values (v_owner, 'Carmen Ruiz Delgado', 'Hotel Rural El Encinar', 'reservas@elencinar.example', '+34 600 000 105',
          'Casa rural de 12 habitaciones en la sierra de Gredos. Temporada alta de abril a octubre.',
          now() - interval '60 days')
  returning id into c_hotel;

  insert into public.clientes (owner_id, nombre, empresa, email, telefono, notas, created_at)
  values (v_owner, 'Pablo Herrero Vidal', 'Ferretería Herrero', null, '+34 600 000 106',
          'No usa mucho el correo: mejor por teléfono o en persona.',
          now() - interval '45 days')
  returning id into c_ferreteria;

  insert into public.clientes (owner_id, nombre, empresa, email, telefono, notas, created_at)
  values (v_owner, 'Elena Castro Molina', 'Estudio Castro Arquitectura', 'elena@castroarquitectura.example', null,
          null,
          now() - interval '30 days')
  returning id into c_arquitectura;

  insert into public.clientes (owner_id, nombre, empresa, email, telefono, notas, created_at)
  values (v_owner, 'Sergio Domínguez León', null, 'sergio.fisio@correo.example', '+34 600 000 108',
          'Fisioterapeuta autónomo.',
          now() - interval '12 days')
  returning id into c_fisio;

  -- 3. Oportunidades: 16, repartidas en las 5 etapas.
  --    - nuevo 3 · contactado 3 · propuesta 4 · ganada 4 · perdida 2
  --    - 2 abiertas con el cierre previsto ya pasado («Vencida» en el panel);
  --    - 7 abiertas con cierre en las próximas semanas y 1 sin fecha.
  --    updated_at se envía en el insert: su trigger solo actúa en los update.
  --    ganada_at no se envía: el trigger oportunidades_ganada_at pone now() en
  --    las ganadas (se ajusta en el paso 4).
  insert into public.oportunidades
    (owner_id, cliente_id, titulo, importe, etapa, fecha_cierre_prevista, created_at, updated_at)
  values
    -- Nuevo
    (v_owner, c_asesores,     'Portal del cliente para documentación',     9750.00, 'nuevo',      v_hoy + 45, now() - interval '6 days',  now() - interval '6 days'),
    (v_owner, c_ferreteria,   'Catálogo online de productos',              3600.00, 'nuevo',      null,       now() - interval '4 days',  now() - interval '4 days'),
    (v_owner, c_arquitectura, 'Hosting y correo profesional (anual)',       420.00, 'nuevo',      v_hoy + 30, now() - interval '2 days',  now() - interval '2 days'),
    -- Contactado
    (v_owner, c_talleres,     'CRM para gestionar las citas del taller',   6500.00, 'contactado', v_hoy + 21, now() - interval '25 days', now() - interval '9 days'),
    (v_owner, c_hotel,        'Motor de reservas en la web',               5400.00, 'contactado', v_hoy - 12, now() - interval '40 days', now() - interval '15 days'),
    (v_owner, c_fisio,        'Agenda online para la consulta',            1290.00, 'contactado', v_hoy + 10, now() - interval '10 days', now() - interval '3 days'),
    -- Propuesta
    (v_owner, c_obrador,      'Tienda online con pedidos para recoger',    4800.00, 'propuesta',  v_hoy + 7,  now() - interval '50 days', now() - interval '5 days'),
    (v_owner, c_clinica,      'Recordatorio de citas por SMS',             1850.00, 'propuesta',  v_hoy - 5,  now() - interval '35 days', now() - interval '20 days'),
    (v_owner, c_asesores,     'Automatización de facturas recibidas',      2450.50, 'propuesta',  v_hoy + 3,  now() - interval '28 days', now() - interval '2 days'),
    (v_owner, c_arquitectura, 'Web portfolio con proyectos',               2750.00, 'propuesta',  v_hoy + 14, now() - interval '20 days', now() - interval '1 day'),
    -- Ganada
    (v_owner, c_obrador,      'Mantenimiento web anual',                    600.00, 'ganada',     v_hoy - 72, now() - interval '110 days', now()),
    (v_owner, c_talleres,     'Web corporativa con presupuestos',          2900.00, 'ganada',     v_hoy - 40, now() - interval '90 days',  now()),
    (v_owner, c_clinica,      'Rediseño de la web de la clínica',          3200.00, 'ganada',     v_hoy,      now() - interval '60 days',  now()),
    (v_owner, c_hotel,        'Fotografía y textos para la web',            950.00, 'ganada',     v_hoy,      now() - interval '30 days',  now()),
    -- Perdida
    (v_owner, c_asesores,     'Consultoría de protección de datos (RGPD)', 1200.00, 'perdida',    v_hoy - 50, now() - interval '75 days', now() - interval '48 days'),
    (v_owner, c_ferreteria,   'Campaña de Google Ads (3 meses)',           1500.00, 'perdida',    v_hoy - 20, now() - interval '42 days', now() - interval '18 days');

  -- 4. Fecha en que se ganó cada oportunidad.
  --    El trigger oportunidades_ganada_at ignora el valor enviado y pone now()
  --    al insertar una ganada, así que todas las ganadas serían «de hoy». Para
  --    que el panel tenga ganadas de este mes y de meses anteriores:
  --     - se desactivan los dos triggers de la tabla SOLO durante este update
  --       (el de updated_at también, porque si no pondría now() en esas filas);
  --     - el update solo toca ganadas del usuario de prueba;
  --     - se vuelven a activar justo después.
  --    `alter table ... disable trigger` lo puede hacer el dueño de la tabla
  --    (postgres, que es quien ejecuta el seed). Es transaccional: si algo
  --    fallara antes del enable, se desharía todo el bloque, también el
  --    disable. Mientras dura, la tabla queda bloqueada para escrituras de
  --    otras sesiones (unos milisegundos), así que nadie se salta el trigger.
  --
  --    Ganadas de meses anteriores: 35 días o más antes de hoy siempre caen en
  --    un mes anterior (ningún mes tiene más de 31 días).
  --    Ganadas de este mes: unos días antes de hoy, pero nunca antes del día 1
  --    del mes en Madrid (`greatest`), para que sigan contando en «Ganado este
  --    mes» aunque el seed se ejecute el día 1.
  alter table public.oportunidades disable trigger oportunidades_ganada_at;
  alter table public.oportunidades disable trigger oportunidades_updated_at;

  update public.oportunidades o
  set ganada_at = g.ganada_at,
      updated_at = g.ganada_at
  from (
    values
      ('Mantenimiento web anual',           now() - interval '70 days'),
      ('Web corporativa con presupuestos',  now() - interval '38 days'),
      ('Rediseño de la web de la clínica',  greatest(v_inicio_mes, now() - interval '3 days')),
      ('Fotografía y textos para la web',   greatest(v_inicio_mes, now() - interval '1 day'))
  ) as g (titulo, ganada_at)
  where o.owner_id = v_owner
    and o.etapa = 'ganada'
    and o.titulo = g.titulo;

  alter table public.oportunidades enable trigger oportunidades_updated_at;
  alter table public.oportunidades enable trigger oportunidades_ganada_at;

  raise notice 'Datos de demostración creados para demo@minicrm.app: 8 clientes y 16 oportunidades.';
end;
$$;
