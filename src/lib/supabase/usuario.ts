import type { User } from "@supabase/supabase-js";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { crearSupabaseServidor } from "./server";

/**
 * Usuario de la sesión actual, comprobado contra Supabase Auth, o null si no hay
 * sesión (o si Supabase no está configurado o no responde). Se guarda en caché
 * durante la petición, así que el layout y la página lo comparten.
 */
export const obtenerUsuario = cache(async (): Promise<User | null> => {
  try {
    const supabase = await crearSupabaseServidor();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return data.user;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
});

/** Devuelve el usuario de la sesión o redirige a /login si no hay (D7). */
export async function requerirUsuario(): Promise<User> {
  const usuario = await obtenerUsuario();
  if (!usuario) {
    redirect("/login");
  }
  return usuario;
}
