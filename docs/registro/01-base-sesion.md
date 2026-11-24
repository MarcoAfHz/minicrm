# 01 · Base: sesión e inicio

## Ronda 1
**develop entregó:**
- clientes de Supabase para el servidor y el navegador;
- un `proxy.ts` que solo refresca la sesión;
- `/login` con Server Action y Zod;
- la zona privada `(app)` con cabecera y `requerirUsuario()`;
- `formatearEuros` y `formatearFecha`;
- 27 tests.

Explicó dos decisiones:
- Con `cacheComponents: true` (por defecto en Next 16), las lecturas de sesión van dentro de `<Suspense>`, o el build falla.
- `formatearEuros` usa `useGrouping: "always"`, porque es-ES no agrupa los números de 4 cifras (saldría `1234,50 €` en vez de `1.234,50 €`).

**testing:** `VEREDICTO: APROBADO`. `npm run check` en verde y redirecciones comprobadas con `next start` y curl.

Avisos que se tienen en cuenta en las siguientes funcionalidades:
- **D9:** `crearSupabaseNavegador` todavía no se usa. Se mantiene porque lo pide el criterio de aceptación.
- **D7:** sin sesión, el HTML incluye la parte estática de la página (el título "Panel"). Todo dato del usuario tiene que ir **dentro** del componente que llama a `requerirUsuario()`.
- **D7:** con Cache Components, las redirecciones de las páginas son HTTP 200 + `meta refresh` en vez de 307. Es el comportamiento documentado de Next 16.
- **D3:** cualquier error de login se muestra como "email o contraseña incorrectos". Es seguro, aunque menos informativo.
- **D6:** falta revisar la cabecera a 375 px en un navegador real.
