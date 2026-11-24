export type ConfigSupabase = { url: string; clave: string };

/**
 * Lee la URL y la clave publicable de Supabase de las variables de entorno.
 * Devuelve null si falta alguna. Las variables se leen con su nombre completo
 * para que Next.js las pueda incluir en el código del navegador.
 */
export function leerConfigSupabase(): ConfigSupabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !clave) {
    return null;
  }
  return { url, clave };
}

export const ERROR_CONFIG_SUPABASE =
  "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";
