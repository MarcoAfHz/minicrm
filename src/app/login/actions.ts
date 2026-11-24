"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { ResultadoAccion } from "@/lib/resultado";
import { crearSupabaseServidor } from "@/lib/supabase/server";
import { esquemaLogin } from "@/lib/validacion/auth";

/**
 * Inicia sesión con email y contraseña. Aquí todavía no hay usuario, así que
 * el paso 1 de D3 no aplica. Si va bien, redirige a /panel.
 */
export async function iniciarSesion(
  _estadoAnterior: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const datos = esquemaLogin.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!datos.success) {
    return {
      ok: false,
      error:
        datos.error.issues[0]?.message ?? "Revisa los datos del formulario.",
    };
  }

  try {
    const supabase = await crearSupabaseServidor();
    const { error } = await supabase.auth.signInWithPassword(datos.data);
    if (error) {
      return { ok: false, error: "El email o la contraseña no son correctos." };
    }
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      error: "No se ha podido iniciar sesión. Inténtalo de nuevo más tarde.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/panel");
}
