/**
 * Indica si el enlace `href` corresponde a la página `ruta` o a una de sus
 * subpáginas: «/clientes» está activo en «/clientes/123/editar», pero no en
 * «/clientes-antiguos».
 */
export function esRutaActiva(ruta: string | null, href: string): boolean {
  if (!ruta) {
    return false;
  }
  const limpia = ruta.length > 1 ? ruta.replace(/\/+$/, "") : ruta;
  return limpia === href || limpia.startsWith(`${href}/`);
}
