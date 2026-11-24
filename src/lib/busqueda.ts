/** Longitud máxima del texto de búsqueda que se manda a la base de datos. */
export const LONGITUD_MAXIMA_BUSQUEDA = 100;

/**
 * Convierte el parámetro `q` de la URL en el texto que se busca: el primero si
 * llega repetido, sin espacios alrededor y con un máximo de 100 caracteres.
 */
export function normalizarBusqueda(valor: string | string[] | undefined): string {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return (texto ?? "").trim().slice(0, LONGITUD_MAXIMA_BUSQUEDA);
}

/**
 * Escapa los comodines de LIKE/ILIKE (`%` y `_`) y la barra invertida, que es
 * su carácter de escape, para buscar el texto tal cual.
 */
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, "\\$&");
}

/**
 * Patrón ILIKE para encontrar `texto` en cualquier parte del valor.
 * PostgREST convierte cada `*` de un patrón LIKE en `%` y no se puede escapar,
 * así que se cambia por `_` (un carácter cualquiera): «a*b» encuentra «a*b».
 */
export function patronContiene(texto: string): string {
  return `%${escaparLike(texto).replace(/\*/g, "_")}%`;
}

/**
 * Filtro de PostgREST (para `.or()`) que busca `texto` en el nombre o en la
 * empresa del cliente. El patrón va entre comillas dobles para que las comas,
 * los puntos y los paréntesis del texto no rompan el filtro; dentro de las
 * comillas, `\` y `"` se escapan con una barra invertida.
 */
export function filtroBusquedaClientes(texto: string): string {
  const valor = `"${patronContiene(texto).replace(/[\\"]/g, "\\$&")}"`;
  return `nombre.ilike.${valor},empresa.ilike.${valor}`;
}
