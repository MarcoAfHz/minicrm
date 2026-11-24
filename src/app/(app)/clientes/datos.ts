import { filtroBusquedaClientes } from "@/lib/busqueda";
import { crearSupabaseServidor } from "@/lib/supabase/server";
import type { Cliente, ClienteOpcion, ClienteResumen } from "@/lib/tipos";
import { esIdCliente } from "@/lib/validacion/cliente";

// Lecturas de clientes para los Server Components. RLS ya filtra por usuario:
// cada consulta devuelve solo los clientes de quien ha iniciado sesión.

const ERROR_LECTURA = "No se han podido cargar los clientes.";

/** Clientes del usuario ordenados por nombre, filtrados por nombre o empresa si hay búsqueda. */
export async function listarClientes(busqueda: string): Promise<ClienteResumen[]> {
  const supabase = await crearSupabaseServidor();
  let consulta = supabase
    .from("clientes")
    .select("id, nombre, empresa, email, telefono")
    .order("nombre", { ascending: true })
    .order("created_at", { ascending: true });

  if (busqueda) {
    consulta = consulta.or(filtroBusquedaClientes(busqueda));
  }

  const { data, error } = await consulta;
  if (error) {
    throw new Error(ERROR_LECTURA);
  }
  return data;
}

/** Un cliente del usuario, o null si el id no es válido, no existe o es de otro usuario. */
export async function obtenerCliente(
  id: string,
  ownerId: string,
): Promise<Cliente | null> {
  if (!esIdCliente(id)) {
    return null;
  }

  const supabase = await crearSupabaseServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, owner_id, nombre, empresa, email, telefono, notas, created_at")
    .eq("id", id)
    // Segunda defensa además de RLS: solo clientes del usuario.
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(ERROR_LECTURA);
  }
  return data;
}

/** Clientes del usuario para elegir en el desplegable de una oportunidad, por nombre. */
export async function listarOpcionesClientes(
  ownerId: string,
): Promise<ClienteOpcion[]> {
  const supabase = await crearSupabaseServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, empresa")
    // Segunda defensa además de RLS: solo clientes del usuario.
    .eq("owner_id", ownerId)
    .order("nombre", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(ERROR_LECTURA);
  }
  return data;
}

/** Si el usuario tiene al menos un cliente. */
export async function tieneClientes(ownerId: string): Promise<boolean> {
  const supabase = await crearSupabaseServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id")
    // Segunda defensa además de RLS: solo clientes del usuario.
    .eq("owner_id", ownerId)
    .limit(1);

  if (error) {
    throw new Error(ERROR_LECTURA);
  }
  return data.length > 0;
}
