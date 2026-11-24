# 03 · Oportunidades y embudo

## Ronda 1
**develop entregó:**
- La migración `oportunidades`: FK a clientes con cascade, checks y trigger de `updated_at` con `search_path = ''`. Las políticas de insert y update llevan `exists` sobre `clientes` para que no se pueda colgar una oportunidad de un cliente **de otro usuario** (la FK sola no lo impide).
- `src/lib/embudo.ts`, que suma en céntimos porque `numeric` puede llegar como texto y 0,1 + 0,2 no da 0,3.
- Zod de importes en formato español.
- El tablero por etapas.
- Crear, editar, borrar y mover de etapa.
- Las oportunidades reales en la ficha del cliente.
- 110 tests nuevos (188 en total).

Aplicó desde el principio las lecciones de los registros 01 y 02: longitudes contadas en caracteres reales, segunda defensa con `owner_id` y datos dentro de `requerirUsuario()`.

**testing:** `VEREDICTO: APROBADO`, con avisos. El orquestador decidió arreglar 6:
1. **[D3/D6] Fallo de dinero:** el patrón de miles aceptaba un primer grupo con cero. "0.500" (alguien que quería decir 0,50 €) se guardaba como **500 €**, mil veces más, sin ningún error. testing lo encontró probando la función con jiti, no solo leyendo los tests.
2. **[D6]** El texto de ayuda no explicaba que "1.234" son miles.
3. **[SQL]** `cliente_id` sin calificar dentro del `exists` de la política. Funcionaba, pero cambiaría de significado si `clientes` tuviera algún día esa columna.
4. **[Revalidación]** Al borrar o renombrar un cliente no se revalidaban `/oportunidades` ni `/panel`.
5. **[D6]** Un importe extremo podía desbordar la tarjeta en la vista de 5 columnas.
6. **[D6]** El "Total" de la ficha sumaba también las oportunidades perdidas.

## Ronda 2
**develop:**
1. Patrón `/^[1-9]\d{0,2}(\.\d{3})+$/`: "0.500" ahora da error de decimales. Tests nuevos.
2. Ayuda: «Usa la coma para los decimales. Ej.: 1.234,56 €.».
3. `oportunidades.cliente_id` calificado.
4. `revalidarClientes()` revalida las 3 rutas, con tests.
5. `break-words`.
6. «En curso» y «Ganado» por separado, con `sumarEnCurso` y `sumarGanado`, que tienen tests.

Ahora hay 196 tests.

**testing:** `VEREDICTO: APROBADO`. Volvió a probar con jiti todos los importes límite.

**Lección:** una regla que parece razonable ("puntos en grupos de 3 = miles") tiene casos límite que cuestan dinero. Por eso `testing` ejecuta las funciones con entradas raras y no se fía solo de los tests que escribe `develop`.
