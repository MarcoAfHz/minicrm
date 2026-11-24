# 06 · Integración continua

(Se hizo antes que la 5 porque no necesita Supabase ni Vercel.)

## Ronda 1
**develop entregó:** `.github/workflows/check.yml`.
- Se lanza en cada push y en cada pull request, con Node 22 y caché de npm.
- Ejecuta `npm ci` y `npm run check`.
- Sin secretos y con `permissions: contents: read`.
- `concurrency` cancela las ejecuciones viejas; timeout de 15 minutos.

También renombró `vitest.config.ts` a `.mts` para quitar la advertencia de ESM. Comprobó `npm ci` en local.

**testing:** `VEREDICTO: FALLOS`.
1. **[D1]** En un checkout **limpio**, como el de GitHub Actions, `npm run check` fallaba con `TS2304: Cannot find name 'LayoutProps'`. Next genera ese tipo en `next-env.d.ts` y `.next/types`, que están en `.gitignore`. `typecheck` se ejecuta antes que `build`, así que en limpio esos tipos todavía no existen. En local pasaba solo por los restos de builds anteriores.

testing lo descubrió simulando la CI: `git archive HEAD` en una carpeta temporal, sin `.next` ni variables, y `npm ci && npm run check`.

## Ronda 2
**develop:** `"typecheck": "next typegen && tsc --noEmit"`. Lo comprobó en un checkout limpio de verdad (reprodujo el fallo antes de arreglarlo).

**testing:** volvió a montar su propia simulación de CI limpia → `VEREDICTO: APROBADO`.

**Lección:** el clásico "en mi máquina funciona". Ni develop ni los tests lo veían, porque el entorno local tenía estado de antes. Para revisar una CI hay que reproducir el entorno de la CI, no fiarse del local.
