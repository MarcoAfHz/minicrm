import { createBrowserClient } from "@supabase/ssr";
import type { BaseDatos } from "./base-datos";
import { ERROR_CONFIG_SUPABASE, leerConfigSupabase } from "./config";

/** Cliente de Supabase para Client Components (navegador). */
export function crearSupabaseNavegador() {
  const config = leerConfigSupabase();
  if (!config) {
    throw new Error(ERROR_CONFIG_SUPABASE);
  }
  return createBrowserClient<BaseDatos>(config.url, config.clave);
}
