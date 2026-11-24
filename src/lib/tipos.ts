/**
 * Tipos del dominio, escritos a mano a partir de las migraciones de
 * supabase/migrations/. Si cambia una tabla, hay que cambiarlos también.
 */

/** Una fila de la tabla `clientes`. */
export type Cliente = {
  id: string;
  owner_id: string;
  nombre: string;
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  /** Fecha ISO con zona horaria (timestamptz). */
  created_at: string;
};

/** Lo que el usuario puede escribir de un cliente en el formulario. */
export type DatosCliente = Pick<
  Cliente,
  "nombre" | "empresa" | "email" | "telefono" | "notas"
>;

/** Lo que se muestra de cada cliente en el listado. */
export type ClienteResumen = Pick<
  Cliente,
  "id" | "nombre" | "empresa" | "email" | "telefono"
>;
