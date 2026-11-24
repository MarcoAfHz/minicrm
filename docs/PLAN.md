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

## [x] 2. Clientes (registro 02)
- Migración de la tabla `clientes`: id, owner_id, nombre (obligatorio), empresa, email, teléfono, notas, created_at. RLS con sus 4 políticas.
- `/clientes`: listado con buscador por nombre o empresa y estado vacío.
- Crear y editar con un formulario validado con Zod (nombre de 2 a 100 caracteres; email válido si se rellena).
- Borrar con confirmación.
- `/clientes/[id]`: ficha del cliente con sus datos y sus oportunidades.

## [x] 3. Oportunidades y embudo (registro 03)
- Migración de la tabla `oportunidades`: id, owner_id, cliente_id (FK a clientes, on delete cascade), titulo, importe numeric(12,2) >= 0, etapa (nuevo, contactado, propuesta, ganada, perdida), fecha_cierre_prevista, created_at. RLS con sus 4 políticas.
- `/oportunidades`: tablero con una columna por etapa, el número de oportunidades y el importe total de cada columna.
- Crear y editar una oportunidad (con el cliente elegido de un desplegable) y cambiarla de etapa desde la tarjeta.
- `src/lib/embudo.ts` con funciones puras para agrupar por etapa y sumar importes, con tests.

## [x] 4. Panel (registro 04)
- `/panel` con tarjetas:
  - importe en curso (etapas abiertas);
  - importe ganado este mes;
  - tasa de éxito (ganadas entre ganadas + perdidas);
  - número de clientes.
- Lista de las próximas 5 oportunidades abiertas por fecha de cierre prevista, marcando las que ya han vencido.
- Los cálculos van en `src/lib/metricas.ts`, con tests, incluido el caso sin datos (sin dividir entre cero).

## [x] 5. Datos de demostración y pulido (registro 05)
- `supabase/seed.sql` o un script con datos de ejemplo para el usuario de prueba.
- Repaso de la interfaz en el móvil, títulos de página (`metadata`) y una página 404.
- `README.md`: qué es, cómo funciona el equipo de agentes, cómo arrancarlo, URL pública y usuario de prueba.

## [x] 6. Integración continua (registro 06)
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

## [ ] 8. Diseño visual (estilo SaaS)
Pedido por el humano después de probar la app: "siento que está feo".
- Color de marca índigo y una paleta definida en un solo sitio (tokens de Tailwind 4 en `globals.css` con `@theme`).
- Escritorio: barra lateral oscura con logo, iconos (lucide-react) y Panel · Clientes · Oportunidades, con el activo resaltado. Abajo, el usuario con un avatar de iniciales y "Salir".
- Móvil (375 px): cabecera compacta con menú desplegable o barra de navegación inferior, sin scroll horizontal.
- Tarjetas con sombra suave y bordes redondeados. Tarjetas del panel con icono y color.
- Colores por etapa coherentes en el tablero, el embudo y las etiquetas. Avatares con las iniciales de cada cliente.
- Login a dos columnas: panel de marca con el nombre de la app y una frase, y el formulario. En el móvil, solo el formulario.
- Botones, inputs y focos visibles y consistentes (accesibilidad: contraste AA y `focus-visible`).
- Sin cambiar textos, rutas ni lógica: los tests y la e2e se basan en ellos.
