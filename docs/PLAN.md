# Plan: Mini CRM

App para que un comercial o una pyme gestione sus **clientes** y sus **oportunidades de venta** con un embudo por etapas. Cada usuario ve solo sus datos.

Estado: `[ ]` pendiente · `[x]` hecha (con el número de su registro en `docs/registro/`).

## [x] 1. Base: sesión e inicio (registro 01)
- Clientes de Supabase para el servidor y para el navegador (`@supabase/ssr`), y un `proxy.ts` que refresque la sesión.
- `/login` con email y contraseña, mensaje de error si falla y redirección a `/panel` si va bien.
- Diseño de la zona privada `src/app/(app)/` con cabecera (nombre de la app, enlaces Panel · Clientes · Oportunidades, email del usuario y botón "Salir"). En el móvil los enlaces caben sin scroll horizontal.
- `/` redirige a `/panel` si hay sesión, y a `/login` si no.
- `src/lib/format.ts` con `formatearEuros` y `formatearFecha` (es-ES), con tests.
- `.env.example` con los nombres de las 2 variables.

## [ ] 2. Clientes
- Migración de la tabla `clientes`: id, owner_id, nombre (obligatorio), empresa, email, teléfono, notas, created_at. RLS con sus 4 políticas.
- `/clientes`: listado con buscador por nombre o empresa y estado vacío.
- Crear y editar con un formulario validado con Zod (nombre de 2 a 100 caracteres; email válido si se rellena).
- Borrar con confirmación.
- `/clientes/[id]`: ficha del cliente con sus datos y sus oportunidades.

## [ ] 3. Oportunidades y embudo
- Migración de la tabla `oportunidades`: id, owner_id, cliente_id (FK a clientes, on delete cascade), titulo, importe numeric(12,2) >= 0, etapa (nuevo, contactado, propuesta, ganada, perdida), fecha_cierre_prevista, created_at. RLS con sus 4 políticas.
- `/oportunidades`: tablero con una columna por etapa, el número de oportunidades y el importe total de cada columna.
- Crear y editar una oportunidad (con el cliente elegido de un desplegable) y cambiarla de etapa desde la tarjeta.
- `src/lib/embudo.ts` con funciones puras para agrupar por etapa y sumar importes, con tests.

## [ ] 4. Panel
- `/panel` con tarjetas:
  - importe en curso (etapas abiertas);
  - importe ganado este mes;
  - tasa de éxito (ganadas entre ganadas + perdidas);
  - número de clientes.
- Lista de las próximas 5 oportunidades abiertas por fecha de cierre prevista, marcando las que ya han vencido.
- Los cálculos van en `src/lib/metricas.ts`, con tests, incluido el caso sin datos (sin dividir entre cero).

## [ ] 5. Datos de demostración y pulido
- `supabase/seed.sql` o un script con datos de ejemplo para el usuario de prueba.
- Repaso de la interfaz en el móvil, títulos de página (`metadata`) y una página 404.
- `README.md`: qué es, cómo funciona el equipo de agentes, cómo arrancarlo, URL pública y usuario de prueba.

## [ ] 6. Integración continua
- `.github/workflows/check.yml`: en cada push y pull request ejecuta `npm ci` y `npm run check` con Node 22, sin secretos.
- Insignia del estado de CI en el README.

## [ ] 7. Prueba de punta a punta en producción
- Playwright (`e2e/`), lanzado con `npm run e2e` contra `E2E_BASE_URL`. Usuario y contraseña en `E2E_EMAIL` y `E2E_PASSWORD`, nunca escritos en el código.
- Flujo:
  1. entrar con el usuario de prueba;
  2. crear un cliente;
  3. crear una oportunidad para él;
  4. moverla a "ganada";
  5. comprobar que el panel lo refleja;
  6. borrar lo creado.
- El mismo flujo a 375 px de ancho (móvil). Sin sesión, `/panel` lleva a `/login`.
