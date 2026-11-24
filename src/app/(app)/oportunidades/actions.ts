"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { ResultadoAccion } from "@/lib/resultado";
import { crearSupabaseServidor } from "@/lib/supabase/server";
import {
  type EstadoFormularioOportunidad,
  esIdOportunidad,
  leerFormularioOportunidad,
  validarCambioEtapa,
  validarOportunidad,
  volverAlCliente,
} from "@/lib/validacion/oportunidad";

const SIN_SESION = "Tu sesión ha caducado. Vuelve a iniciar sesión.";
const REVISA_CAMPOS = "Revisa los campos marcados.";
const NO_ENCONTRADA =
  "No se ha encontrado la oportunidad. Puede que ya se haya borrado.";
const CLIENTE_NO_ENCONTRADO =
  "Ese cliente no existe o se ha borrado. Elige otro de la lista.";

type Supabase = Awaited<ReturnType<typeof crearSupabaseServidor>>;

/**
 * Comprueba que el cliente es del usuario antes de colgarle una oportunidad.
 * La política de RLS también lo exige; esto da un error claro en el campo.
 * Devuelve null si la consulta falla.
 */
async function esClienteDelUsuario(
  supabase: Supabase,
  clienteId: string,
  ownerId: string,
): Promise<boolean | null> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) {
    return null;
  }
  return data !== null;
}

/** Las páginas que muestran oportunidades: el tablero, las fichas de cliente y el panel. */
function revalidarOportunidades() {
  revalidatePath("/oportunidades", "layout");
  revalidatePath("/clientes", "layout");
  revalidatePath("/panel");
}

function destino(volver: FormDataEntryValue | null, clienteId: string): string {
  return volverAlCliente(volver) ? `/clientes/${clienteId}` : "/oportunidades";
}

/** Crea una oportunidad y vuelve al tablero (o a la ficha del cliente). */
export async function crearOportunidad(
  _estadoAnterior: EstadoFormularioOportunidad | null,
  formData: FormData,
): Promise<EstadoFormularioOportunidad> {
  const valores = leerFormularioOportunidad(formData);
  const errorGuardar =
    "No se ha podido guardar la oportunidad. Inténtalo de nuevo.";
  let ruta: string;

  try {
    const supabase = await crearSupabaseServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: SIN_SESION, valores };
    }

    const validacion = validarOportunidad(valores);
    if (!validacion.ok) {
      return {
        ok: false,
        error: REVISA_CAMPOS,
        errores: validacion.errores,
        valores,
      };
    }
    const datos = validacion.datos;

    const clienteValido = await esClienteDelUsuario(
      supabase,
      datos.cliente_id,
      user.id,
    );
    if (clienteValido === null) {
      return { ok: false, error: errorGuardar, valores };
    }
    if (!clienteValido) {
      return {
        ok: false,
        error: REVISA_CAMPOS,
        errores: { cliente_id: CLIENTE_NO_ENCONTRADO },
        valores,
      };
    }

    const { error } = await supabase.from("oportunidades").insert(datos);
    if (error) {
      return { ok: false, error: errorGuardar, valores };
    }
    ruta = destino(formData.get("volver"), datos.cliente_id);
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: errorGuardar, valores };
  }

  revalidarOportunidades();
  redirect(ruta);
}

/** Guarda los cambios de una oportunidad y vuelve al tablero (o a la ficha del cliente). */
export async function actualizarOportunidad(
  _estadoAnterior: EstadoFormularioOportunidad | null,
  formData: FormData,
): Promise<EstadoFormularioOportunidad> {
  const valores = leerFormularioOportunidad(formData);
  const errorGuardar =
    "No se han podido guardar los cambios. Inténtalo de nuevo.";
  let ruta: string;

  try {
    const supabase = await crearSupabaseServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: SIN_SESION, valores };
    }

    const id = formData.get("id");
    if (!esIdOportunidad(id)) {
      return { ok: false, error: NO_ENCONTRADA, valores };
    }

    const validacion = validarOportunidad(valores);
    if (!validacion.ok) {
      return {
        ok: false,
        error: REVISA_CAMPOS,
        errores: validacion.errores,
        valores,
      };
    }
    const datos = validacion.datos;

    const clienteValido = await esClienteDelUsuario(
      supabase,
      datos.cliente_id,
      user.id,
    );
    if (clienteValido === null) {
      return { ok: false, error: errorGuardar, valores };
    }
    if (!clienteValido) {
      return {
        ok: false,
        error: REVISA_CAMPOS,
        errores: { cliente_id: CLIENTE_NO_ENCONTRADO },
        valores,
      };
    }

    const { data, error } = await supabase
      .from("oportunidades")
      .update(datos)
      .eq("id", id)
      // Segunda defensa además de RLS: solo oportunidades del usuario.
      .eq("owner_id", user.id)
      .select("id");
    if (error) {
      return { ok: false, error: errorGuardar, valores };
    }
    // Si la oportunidad es de otro usuario, la actualización no devuelve
    // ninguna fila, igual que si no existiera.
    if (data.length === 0) {
      return { ok: false, error: NO_ENCONTRADA, valores };
    }
    ruta = destino(formData.get("volver"), datos.cliente_id);
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: errorGuardar, valores };
  }

  revalidarOportunidades();
  redirect(ruta);
}

/** Borra una oportunidad. La confirmación se pide en el navegador. */
export async function borrarOportunidad(
  _estadoAnterior: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const errorBorrar =
    "No se ha podido borrar la oportunidad. Inténtalo de nuevo.";
  let ruta: string;

  try {
    const supabase = await crearSupabaseServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: SIN_SESION };
    }

    const id = formData.get("id");
    if (!esIdOportunidad(id)) {
      return { ok: false, error: NO_ENCONTRADA };
    }

    const { data, error } = await supabase
      .from("oportunidades")
      .delete()
      .eq("id", id)
      // Segunda defensa además de RLS: solo oportunidades del usuario.
      .eq("owner_id", user.id)
      .select("id, cliente_id");
    if (error) {
      return { ok: false, error: errorBorrar };
    }
    const borrada = data[0];
    if (!borrada) {
      return { ok: false, error: NO_ENCONTRADA };
    }
    ruta = destino(formData.get("volver"), borrada.cliente_id);
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: errorBorrar };
  }

  revalidarOportunidades();
  redirect(ruta);
}

/** Mueve una oportunidad a otra etapa desde su tarjeta del tablero. */
export async function cambiarEtapa(
  _estadoAnterior: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const errorMover = "No se ha podido cambiar la etapa. Inténtalo de nuevo.";

  try {
    const supabase = await crearSupabaseServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: SIN_SESION };
    }

    const validacion = validarCambioEtapa({
      id: formData.get("id"),
      etapa: formData.get("etapa"),
    });
    if (!validacion.ok) {
      return { ok: false, error: validacion.error };
    }
    const { id, etapa } = validacion.datos;

    const { data, error } = await supabase
      .from("oportunidades")
      .update({ etapa })
      .eq("id", id)
      // Segunda defensa además de RLS: solo oportunidades del usuario.
      .eq("owner_id", user.id)
      .select("id");
    if (error) {
      return { ok: false, error: errorMover };
    }
    if (data.length === 0) {
      return { ok: false, error: NO_ENCONTRADA };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: errorMover };
  }

  revalidarOportunidades();
  return { ok: true };
}
