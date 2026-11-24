# Directrices de calidad

Las escribe y las hace cumplir el agente `testing`. El agente `develop` tiene que cumplirlas **todas** para que una funcionalidad se apruebe. Cada fallo se cita con su código (D1, D2…).

## D1. Todo pasa
`npm run check` (ESLint, TypeScript, Vitest y `next build`) termina sin errores.

## D2. TypeScript estricto
- Prohibido `any`, `@ts-ignore` y `@ts-expect-error`.
- Los datos que vienen de Supabase o de formularios tienen un tipo declarado.

## D3. Server Actions seguras
Cada Server Action, en este orden:
1. Obtiene el usuario con `supabase.auth.getUser()` y, si no hay, devuelve un error sin tocar nada.
2. Valida la entrada con un esquema **Zod** que está en `src/lib/`.
3. Devuelve `{ ok: true }` o `{ ok: false, error }` con un mensaje en español. No deja escapar excepciones sin controlar ni errores internos de la base de datos.

## D4. Datos aislados por usuario
- Cada tabla tiene `owner_id` con valor por defecto `auth.uid()`, **RLS activado** y políticas de select, insert, update y delete con `owner_id = auth.uid()`.
- Las relaciones entre tablas usan claves foráneas, con `on delete` definido.
- Los cambios de esquema solo se hacen con migraciones en `supabase/migrations/`.

## D5. Lógica con tests
- La lógica de negocio va en `src/lib/` como funciones puras: cálculos del embudo, totales, formatos, validaciones.
- Cada función exportada de `src/lib/` (menos los clientes de Supabase) tiene tests en Vitest con al menos un caso normal y uno límite (lista vacía, cero, valor no válido…).

## D6. Interfaz usable
- Todos los textos en español.
- Cada campo de formulario tiene `<label>`.
- Los errores de validación se ven junto al formulario.
- Cada listado tiene un estado vacío con un texto que explica qué hacer.
- Se puede usar a 375 px de ancho sin scroll horizontal.
- Los importes se muestran en euros con formato español (`1.234,50 €`) y las fechas en formato español.

## D7. Rutas privadas protegidas
- Las páginas de `src/app/(app)/` comprueban la sesión en el servidor y redirigen a `/login` si no hay usuario.
- El `proxy` solo refresca la sesión: no es la única protección.

## D8. Secretos
- No hay claves en el código ni en los commits. Solo se usan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, leídas de las variables de entorno.
- La clave `service_role` no aparece nunca.
- `.env.example` lleva solo los nombres de las variables, sin valores.

## D9. Código limpio
- Nada de `console.log`, código comentado ni archivos sin usar.
- Los nombres de dominio (cliente, oportunidad, etapa) son coherentes en toda la app.
