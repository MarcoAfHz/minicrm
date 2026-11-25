/**
 * Colores posibles de un avatar. Son nombres, no clases: el componente
 * (src/components/ui/avatar.tsx) decide cómo se pinta cada uno.
 */
export const COLORES_AVATAR = [
  "indigo",
  "sky",
  "violet",
  "amber",
  "emerald",
  "rose",
  "teal",
  "fuchsia",
] as const;

export type ColorAvatar = (typeof COLORES_AVATAR)[number];

/** Lo que se muestra cuando no hay ninguna letra con la que formar iniciales. */
export const SIN_INICIALES = "?";

/** Primera letra o cifra de una palabra (respeta tildes y la ñ), o null. */
function primeraLetra(palabra: string): string | null {
  const letra = Array.from(palabra).find((caracter) =>
    /[\p{L}\p{N}]/u.test(caracter),
  );
  return letra ?? null;
}

/**
 * Iniciales de un nombre para un avatar: la primera letra de la primera y de la
 * última palabra («Ana María López» → «AL»), o solo una si hay una palabra
 * («Acme» → «A»). Ignora los signos («(Acme)» → «A»). Sin letras, «?».
 */
export function iniciales(nombre: string): string {
  const letras = nombre
    .split(/\s+/)
    .map(primeraLetra)
    .filter((letra): letra is string => letra !== null);

  if (letras.length === 0) {
    return SIN_INICIALES;
  }
  const resultado =
    letras.length === 1 ? letras[0] : `${letras[0]}${letras[letras.length - 1]}`;
  return resultado.toLocaleUpperCase("es-ES");
}

/**
 * Iniciales a partir de un email: se usa la parte de antes de la @ y cada
 * punto, guion o guion bajo separa palabras («ana.lopez@x.es» → «AL»).
 */
export function inicialesDeEmail(email: string): string {
  const usuario = email.split("@")[0] ?? "";
  return iniciales(usuario.replace(/[._+-]+/g, " "));
}

/**
 * Color de avatar para un nombre. Siempre el mismo para el mismo nombre (sin
 * distinguir mayúsculas ni espacios de más), para que cada cliente se reconozca
 * por su color en todas las pantallas.
 */
export function colorAvatar(nombre: string): ColorAvatar {
  const clave = nombre.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-ES");
  let hash = 0;
  for (const caracter of clave) {
    hash = (hash * 31 + (caracter.codePointAt(0) ?? 0)) >>> 0;
  }
  return COLORES_AVATAR[hash % COLORES_AVATAR.length];
}
