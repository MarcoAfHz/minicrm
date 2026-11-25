/**
 * Clases de Tailwind compartidas por toda la app, para que botones, campos y
 * tarjetas se vean igual en todas las pantallas. Los colores salen de los
 * tokens de src/app/globals.css.
 *
 * El tamaño (padding) va aparte del color para no tener que pisar clases: con
 * dos clases del mismo tipo en un elemento, Tailwind no garantiza cuál gana.
 */

const BOTON =
  "inline-flex items-center justify-center gap-2 rounded-lg text-center text-sm font-medium shadow-tarjeta transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const NORMAL = "px-4 py-2";
const PEQUENO = "px-3 py-1.5";

const PRIMARIO = "bg-marca-600 text-white hover:bg-marca-700";
const SECUNDARIO =
  "border border-borde-fuerte bg-superficie text-texto hover:bg-fondo";
const PELIGRO =
  "border border-red-300 bg-superficie text-red-700 hover:border-red-400 hover:bg-red-50";

/** Acción principal de la pantalla (índigo). */
export const BOTON_PRIMARIO = `${BOTON} ${NORMAL} ${PRIMARIO}`;

/** Acción secundaria: blanca con borde. */
export const BOTON_SECUNDARIO = `${BOTON} ${NORMAL} ${SECUNDARIO}`;

/** Acción secundaria pequeña (dentro de una tarjeta o de la cabecera). */
export const BOTON_SECUNDARIO_PEQUENO = `${BOTON} ${PEQUENO} ${SECUNDARIO}`;

/** Acción destructiva (borrar). */
export const BOTON_PELIGRO = `${BOTON} ${NORMAL} ${PELIGRO}`;

const CAMPO_BASE =
  "w-full rounded-lg border border-borde-fuerte bg-superficie text-base text-texto shadow-tarjeta transition-colors placeholder:text-texto-tenue hover:border-borde-intenso focus-visible:border-marca-600 focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-marca-600/25 aria-invalid:border-red-600";

/** Campo de texto, desplegable o área de texto. */
export const CAMPO = `${CAMPO_BASE} px-3 py-2`;

/** Campo con un icono a la izquierda (el buscador). */
export const CAMPO_CON_ICONO = `${CAMPO_BASE} py-2 pr-3 pl-10`;

/** Campo pequeño (dentro de una tarjeta). En el móvil sigue a 16 px para que iOS no haga zoom. */
export const CAMPO_PEQUENO = `${CAMPO_BASE} px-2 py-1.5 sm:text-sm`;

/** Texto de la etiqueta (`<label>`) de un campo. */
export const ETIQUETA_CAMPO = "text-sm font-medium text-texto";

/** Tarjeta blanca con borde y sombra suave. */
export const TARJETA =
  "rounded-xl border border-borde bg-superficie shadow-tarjeta";

/** Título principal (h1) de cada pantalla. */
export const TITULO_PAGINA =
  "text-2xl font-semibold tracking-tight text-texto";

/** Título de una sección (h2). */
export const TITULO_SECCION = "text-lg font-semibold text-texto";

/** Enlace suelto (fuera de un párrafo), en el color de la marca. */
export const ENLACE =
  "rounded-sm text-sm font-medium text-marca-700 hover:text-marca-900 hover:underline";

/** Enlace dentro de un texto: subrayado para no depender solo del color. */
export const ENLACE_EN_TEXTO =
  "rounded-sm underline decoration-borde-fuerte underline-offset-2 hover:text-marca-700 hover:decoration-current";

/** Enlace «← Volver a…» de arriba de cada pantalla. */
export const ENLACE_VOLVER =
  "self-start rounded-sm text-sm font-medium text-texto-suave hover:text-marca-700";

/** Caja de error de un formulario. */
export const AVISO_ERROR =
  "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700";
