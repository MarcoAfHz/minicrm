import { crearSupabaseServidor } from "@/lib/supabase/server";
import type {
  Oportunidad,
  OportunidadConCliente,
  OportunidadResumen,
} from "@/lib/tipos";
import { esIdCliente } from "@/lib/validacion/cliente";
import { esIdOportunidad } from "@/lib/validacion/oportunidad";

// Lecturas de oportunidades para los Server Components. RLS ya filtra por
// usuario; además, cada consulta filtra por owner_id como segunda defensa.

const ERROR_LECTURA = "No se han podido cargar las oportunidades.";

const COLUMNAS_RESUMEN =
  "id, cliente_id, titulo, importe, etapa, fecha_cierre_prevista";

/**
 * Oportunidades del usuario con el nombre de su cliente, para el tablero.
 * Primero las que cierran antes; las que no tienen fecha, al final.
 */
export async function listarOportunidades(
  ownerId: string,
): Promise<OportunidadConCliente[]> {
  const supabase = await crearSupabaseServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .select(`${COLUMNAS_RESUMEN}, cliente:clientes(id, nombre)`)
    .eq("owner_id", ownerId)
    .order("fecha_cierre_prevista", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(ERROR_LECTURA);
  }
  return data;
}

/** Oportunidades de un cliente del usuario, en el mismo orden que el tablero. */
export async function listarOportunidadesDeCliente(
  clienteId: string,
  ownerId: string,
): Promise<OportunidadResumen[]> {
  if (!esIdCliente(clienteId)) {
    return [];
  }

  const supabase = await crearSupabaseServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .select(COLUMNAS_RESUMEN)
    .eq("cliente_id", clienteId)
    .eq("owner_id", ownerId)
    .order("fecha_cierre_prevista", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(ERROR_LECTURA);
  }
  return data;
}

/** Una oportunidad del usuario, o null si el id no es válido, no existe o es de otro usuario. */
export async function obtenerOportunidad(
  id: string,
  ownerId: string,
): Promise<Oportunidad | null> {
  if (!esIdOportunidad(id)) {
    return null;
  }

  const supabase = await crearSupabaseServidor();
  const { data, error } = await supabase
    .from("oportunidades")
    .select(
      "id, owner_id, cliente_id, titulo, importe, etapa, fecha_cierre_prevista, created_at, updated_at",
    )
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(ERROR_LECTURA);
  }
  return data;
}
