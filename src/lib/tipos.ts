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

/** Etapas del embudo de ventas: las mismas que el `check` de la migración. */
export type Etapa = "nuevo" | "contactado" | "propuesta" | "ganada" | "perdida";

/**
 * Importe de una columna `numeric(12,2)`. Según cómo se lea, Supabase lo
 * devuelve como número o como texto: hay que normalizarlo antes de sumar o
 * mostrarlo (src/lib/embudo.ts).
 */
export type Importe = number | string;

/** Una fila de la tabla `oportunidades`. */
export type Oportunidad = {
  id: string;
  owner_id: string;
  cliente_id: string;
  titulo: string;
  importe: Importe;
  etapa: Etapa;
  /** Fecha sin hora (YYYY-MM-DD) o null si no se ha indicado. */
  fecha_cierre_prevista: string | null;
  /** Fecha ISO con zona horaria (timestamptz). */
  created_at: string;
  /** Fecha ISO con zona horaria (timestamptz). */
  updated_at: string;
};

/** Lo que el usuario puede escribir de una oportunidad en el formulario. */
export type DatosOportunidad = {
  cliente_id: string;
  titulo: string;
  /** En euros, con 2 decimales como máximo. */
  importe: number;
  etapa: Etapa;
  fecha_cierre_prevista: string | null;
};

/** Lo que se muestra de cada oportunidad en el tablero y en la ficha del cliente. */
export type OportunidadResumen = Pick<
  Oportunidad,
  "id" | "cliente_id" | "titulo" | "importe" | "etapa" | "fecha_cierre_prevista"
>;

/** Oportunidad del tablero con el nombre de su cliente. */
export type OportunidadConCliente = OportunidadResumen & {
  cliente: Pick<Cliente, "id" | "nombre"> | null;
};

/** Cliente que se puede elegir en el desplegable del formulario de oportunidad. */
export type ClienteOpcion = Pick<Cliente, "id" | "nombre" | "empresa">;
