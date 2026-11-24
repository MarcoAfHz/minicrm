# 04 · Panel

## Ronda 1
**develop entregó:**
- `/panel` con 4 tarjetas: En curso, Ganado este mes, Tasa de éxito y Clientes.
- La lista «Próximos cierres», marcando las vencidas.
- Un resumen del embudo con barras hechas solo con CSS y los valores escritos en texto.
- Todos los cálculos en `src/lib/metricas.ts`, como funciones puras que reciben `ahora` como parámetro.
- Una sola consulta de oportunidades y un `count` (head) de clientes, ambos con `owner_id`.
- 59 tests nuevos (255 en total):
  - zona horaria de Madrid, también en los cambios de hora de marzo y octubre;
  - tasa de éxito que nunca muestra un 0 % o un 100 % engañoso;
  - lista vacía sin dividir entre cero.

**testing:** `VEREDICTO: APROBADO`. Probó con jiti los límites de mes y de día en Madrid y comprobó que «ahora» no se prerenderiza en el build. Dejó un aviso importante:
- **[Métrica]** «Ganado este mes» usaba `updated_at`, y el trigger lo cambia en cualquier UPDATE. Al editar en noviembre una oportunidad ganada en octubre, sin tocar su etapa, pasaba a contar en noviembre.

El orquestador decidió arreglarlo bien, sin conformarse con dejar documentada la aproximación.

## Ronda 2
**develop:**
1. Migración nueva `ganada_at`: un trigger `before insert or update` pone `now()` al pasar a «ganada», conserva la fecha si sigue ganada y la deja en `null` en otra etapa. Ignora el valor que envíe el cliente.
   - Backfill de las ganadas que ya existían, hecho **antes** de crear el trigger y con el trigger de `updated_at` desactivado.
   - `ganada_at` queda fuera de los tipos Insert y Update.
2. `ZONA_HORARIA` definida en un solo sitio.

Ahora hay 256 tests.

**testing:** `VEREDICTO: APROBADO`. Revisó el SQL a fondo:
- `OLD` vale NULL en un INSERT desde PG 11;
- con dos triggers BEFORE, el orden alfabético no cambia nada porque cada uno escribe una columna distinta;
- `disable trigger` lo puede hacer el dueño de la tabla.

Queda pendiente probar el trigger en una base de datos real.

**Lección:** que una métrica sea "aproximada y documentada" no es suficiente si el usuario puede ver una cifra falsa sin saberlo. Mejor dar a la base de datos el dato que de verdad hace falta.
