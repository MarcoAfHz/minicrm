"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { ResultadoAccion } from "@/lib/resultado";
import { crearSupabaseServidor } from "@/lib/supabase/server";

/** Cierra la sesión del usuario y lo lleva a /login. */
export async function cerrarSesion(): Promise<ResultadoAccion> {
  try {
    const supabase = await crearSupabaseServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "No hay ninguna sesión abierta." };
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        ok: false,
        error: "No se ha podido cerrar la sesión. Inténtalo de nuevo.",
      };
    }
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      error: "No se ha podido cerrar la sesión. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
