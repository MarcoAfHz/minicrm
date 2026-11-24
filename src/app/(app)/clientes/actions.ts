"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { ResultadoAccion } from "@/lib/resultado";
import { crearSupabaseServidor } from "@/lib/supabase/server";
import {
  type EstadoFormularioCliente,
  esIdCliente,
  leerFormularioCliente,
  validarCliente,
} from "@/lib/validacion/cliente";

const SIN_SESION = "Tu sesión ha caducado. Vuelve a iniciar sesión.";
const REVISA_CAMPOS = "Revisa los campos marcados.";
const NO_ENCONTRADO = "No se ha encontrado el cliente. Puede que ya se haya borrado.";

/** Crea un cliente y lleva a su ficha. */
export async function crearCliente(
  _estadoAnterior: EstadoFormularioCliente | null,
  formData: FormData,
): Promise<EstadoFormularioCliente> {
  const valores = leerFormularioCliente(formData);
  const errorGuardar = "No se ha podido guardar el cliente. Inténtalo de nuevo.";
  let id: string;

  try {
    const supabase = await crearSupabaseServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: SIN_SESION, valores };
    }

    const validacion = validarCliente(valores);
    if (!validacion.ok) {
      return { ok: false, error: REVISA_CAMPOS, errores: validacion.errores, valores };
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert(validacion.datos)
      .select("id")
      .single();
    if (error) {
      return { ok: false, error: errorGuardar, valores };
    }
    id = data.id;
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: errorGuardar, valores };
  }

  revalidatePath("/clientes", "layout");
  redirect(`/clientes/${id}`);
}

/** Guarda los cambios de un cliente y vuelve a su ficha. */
export async function actualizarCliente(
  _estadoAnterior: EstadoFormularioCliente | null,
  formData: FormData,
): Promise<EstadoFormularioCliente> {
  const valores = leerFormularioCliente(formData);
  const errorGuardar = "No se han podido guardar los cambios. Inténtalo de nuevo.";
  let id: string;

  try {
    const supabase = await crearSupabaseServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: SIN_SESION, valores };
    }

    const idFormulario = formData.get("id");
    if (!esIdCliente(idFormulario)) {
      return { ok: false, error: NO_ENCONTRADO, valores };
    }
    id = idFormulario;

    const validacion = validarCliente(valores);
    if (!validacion.ok) {
      return { ok: false, error: REVISA_CAMPOS, errores: validacion.errores, valores };
    }

    const { data, error } = await supabase
      .from("clientes")
      .update(validacion.datos)
      .eq("id", id)
      // Segunda defensa además de RLS: solo clientes del usuario.
      .eq("owner_id", user.id)
      .select("id");
    if (error) {
      return { ok: false, error: errorGuardar, valores };
    }
    // Si el cliente es de otro usuario, la actualización no devuelve ninguna
    // fila, igual que si el cliente no existiera.
    if (data.length === 0) {
      return { ok: false, error: NO_ENCONTRADO, valores };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: errorGuardar, valores };
  }

  revalidatePath("/clientes", "layout");
  redirect(`/clientes/${id}`);
}

/** Borra un cliente y vuelve al listado. La confirmación se pide en el navegador. */
export async function borrarCliente(
  _estadoAnterior: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const errorBorrar = "No se ha podido borrar el cliente. Inténtalo de nuevo.";

  try {
    const supabase = await crearSupabaseServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: SIN_SESION };
    }

    const id = formData.get("id");
    if (!esIdCliente(id)) {
      return { ok: false, error: NO_ENCONTRADO };
    }

    const { data, error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id)
      // Segunda defensa además de RLS: solo clientes del usuario.
      .eq("owner_id", user.id)
      .select("id");
    if (error) {
      return { ok: false, error: errorBorrar };
    }
    if (data.length === 0) {
      return { ok: false, error: NO_ENCONTRADO };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: errorBorrar };
  }

  revalidatePath("/clientes", "layout");
  redirect("/clientes");
}
