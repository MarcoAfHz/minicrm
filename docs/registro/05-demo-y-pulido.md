# 05 · Datos de demostración y pulido

## Ronda 1
**develop entregó:**
- `supabase/seed.sql`, idempotente para `demo@minicrm.app`, en un único bloque `DO` (atómico):
  - 8 clientes y 16 oportunidades;
  - fechas relativas a hoy **en Madrid** (en Supabase `current_date` daría el día en UTC);
  - 2 ganadas en meses anteriores, conseguidas desactivando el trigger `ganada_at` solo durante un `update` acotado.
- 404 en español e icono propio.
- README.
- `listarClientes` también filtra ahora por `owner_id`, para que el README no prometa nada que no se cumpla.

Lo probó en PGlite con las 3 migraciones reales.

**Fallo encontrado en la prueba manual** (el humano, con Supabase conectado, en `next dev`): "1 Issue" en todas las rutas privadas:
```
Route "/panel": Next.js encountered the unstable value `Date.now()` while prerendering.
```
`npm run check` no lo detectaba, porque el build pasaba. El origen no era solo nuestro `new Date()` del panel: `auth.getUser()` de Supabase compara la caducidad del token con `Date.now()`.

El orquestador se lo pasó a develop, que lo arregló con `await connection()` en `crearSupabaseServidor()` (después de `cookies()`) y en el panel, con un test del orden. Confirmado en el navegador: el aviso ha desaparecido.

**testing:** `VEREDICTO: APROBADO`.
- Volvió a ejecutar el seed en PGlite, con fechas fijas y casos límite (día 1 de mes, cambios de hora y 28 de febrero) y forzando un fallo a mitad para comprobar que es atómico.
- Comprobó la sintaxis de la CLI (`db push --remote --include-seed`).
- Contrastó cada afirmación del README con el código y los registros.

Avisos:
- **[README]** "Se crean… desde la propia tarjeta" era inexacto. Lo corrigió el orquestador, porque es documentación y no código.
- **[CLAUDE.md]** develop dijo que había leído `.env.example` por error. Solo contiene nombres de variables, así que no se filtró nada, pero queda registrado como incumplimiento de la regla.
- **[D6]** El responsive a 375 px está revisado leyendo el código. Lo comprobará la e2e (funcionalidad 7).

**Lección:** hay fallos que solo aparecen con datos y sesión reales. La prueba manual en el navegador encontró uno que ni los tests ni el build veían.
