import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { BaseDatos } from "./base-datos";
import { ERROR_CONFIG_SUPABASE, leerConfigSupabase } from "./config";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Hay que crear uno nuevo en cada petición.
 */
export async function crearSupabaseServidor() {
  // Primero las cookies: así la ruta pasa a ser dinámica y en el build
  // no se llega a leer la configuración.
  const almacenCookies = await cookies();
  // Supabase Auth compara la caducidad del token con la hora actual
  // (Date.now()). Con Cache Components eso da error si Next está
  // prerenderizando, aunque ya se hayan leído las cookies: connection() deja
  // la sesión y las consultas para la petición real del usuario.
  await connection();
  const config = leerConfigSupabase();
  if (!config) {
    throw new Error(ERROR_CONFIG_SUPABASE);
  }

  return createServerClient<BaseDatos>(config.url, config.clave, {
    cookies: {
      getAll() {
        return almacenCookies.getAll();
      },
      setAll(cookiesNuevas) {
        try {
          cookiesNuevas.forEach(({ name, value, options }) =>
            almacenCookies.set(name, value, options),
          );
        } catch {
          // Los Server Components no pueden escribir cookies. No pasa nada:
          // el proxy ya refresca la sesión en cada petición.
        }
      },
    },
  });
}
