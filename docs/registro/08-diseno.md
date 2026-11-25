# 08 · Diseño visual (estilo SaaS)

Pedido por el humano después de probar la app con datos reales: "siento que está feo". Eligió entre 3 propuestas el estilo "SaaS moderno".

## Ronda 1
**develop entregó:**
- Tokens de Tailwind 4 en `globals.css` (`@theme`): marca índigo, superficies, texto, bordes, sombras y un color por etapa.
- `lucide-react` 1.79.0 (versión exacta) y ninguna otra librería de UI.
- Barra lateral oscura en escritorio, con `aria-current` en el enlace activo. En el móvil, cabecera compacta y barra inferior fija: son solo 3 destinos, así que no hace falta menú ni JS extra.
- Panel con tarjetas de icono, avatares de cliente con color determinista (`src/lib/avatar.ts`, con tests) y colores por etapa centralizados en `components/ui/etapa.tsx`.
- Clases compartidas para botones y campos en `components/ui/clases.ts`.
- Login a dos columnas. La 404 y `error.tsx` con el mismo estilo.
- 22 tests nuevos (283 en total).

El trabajo se interrumpió a mitad porque el humano pausó la sesión, y se retomó al día siguiente sobre los mismos cambios sin commitear.

**testing:** `VEREDICTO: APROBADO`.
- Calculó los ratios de contraste WCAG desde los oklch de Tailwind 4: todos los textos AA.
- Comparó con un script los textos, `name`, `href`, `aria-*`… entre HEAD y la copia de trabajo. No se ha cambiado ningún texto ni ninguna ruta, solo se han movido.

Avisos que el orquestador decidió arreglar:
1. **[WCAG 2.4.11]** El foco podía quedar tapado por la cabecera o la barra fijas al tabular en el móvil.
2. **[Safe-area]** `env(safe-area-inset-bottom)` no tenía efecto sin `viewport-fit=cover`.
3. **[Comentario]** `globals.css` decía que `texto-tenue` cumple AA sobre slate-100, pero da 4,35:1.

También avisó para la e2e de que hay navegación y "Salir" duplicados en el DOM, ocultos con CSS: hay que usar `getByRole`.

## Ronda 2
**develop:**
1. `scroll-padding-top` y `scroll-padding-bottom` en `html`, solo por debajo de lg, calculados con las alturas reales.
2. `export const viewport` con `viewportFit: "cover"`, más los insets en la cabecera, la barra inferior, el body, el login y la 404.
3. Comentario corregido.

**testing:** `VEREDICTO: APROBADO`. Comprobó los cálculos de altura contra las clases reales.
