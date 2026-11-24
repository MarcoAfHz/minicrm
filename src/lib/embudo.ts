import type { Etapa, Importe } from "@/lib/tipos";

/** Etapas del embudo en el orden en que se recorren. */
export const ETAPAS = [
  "nuevo",
  "contactado",
  "propuesta",
  "ganada",
  "perdida",
] as const satisfies readonly Etapa[];

/** Nombre de cada etapa para mostrar en pantalla. */
export const ETIQUETAS_ETAPA: Record<Etapa, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  propuesta: "Propuesta",
  ganada: "Ganada",
  perdida: "Perdida",
};

export function esEtapa(valor: unknown): valor is Etapa {
  return ETAPAS.some((etapa) => etapa === valor);
}

/** Lo mínimo que necesitan las funciones del embudo de cada oportunidad. */
type ConEtapa = { etapa: string };
type ConImporte = { importe: Importe };

/**
 * Convierte un importe en céntimos enteros, para sumar sin errores de coma
 * flotante (0,10 + 0,20 tiene que dar 0,30). Acepta el número o el texto que
 * devuelve Supabase para una columna numeric; si no es un número válido,
 * cuenta como 0.
 */
export function importeACentimos(importe: Importe): number {
  const numero =
    typeof importe === "number"
      ? importe
      : importe.trim() === ""
        ? Number.NaN
        : Number(importe);
  if (!Number.isFinite(numero)) {
    return 0;
  }
  return Math.round(numero * 100);
}

/** El importe normalizado en euros (con 2 decimales como máximo). */
export function importeAEuros(importe: Importe): number {
  return importeACentimos(importe) / 100;
}

/** Suma los importes de las oportunidades, en euros. */
export function sumarImportes(oportunidades: readonly ConImporte[]): number {
  const centimos = oportunidades.reduce(
    (total, oportunidad) => total + importeACentimos(oportunidad.importe),
    0,
  );
  return centimos / 100;
}

/** Etapas en las que la venta sigue abierta (ni ganada ni perdida). */
export const ETAPAS_EN_CURSO = [
  "nuevo",
  "contactado",
  "propuesta",
] as const satisfies readonly Etapa[];

/** Suma, en euros, los importes de las oportunidades que siguen abiertas. */
export function sumarEnCurso(
  oportunidades: readonly (ConEtapa & ConImporte)[],
): number {
  return sumarImportes(
    oportunidades.filter((oportunidad) =>
      ETAPAS_EN_CURSO.some((etapa) => etapa === oportunidad.etapa),
    ),
  );
}

/** Suma, en euros, los importes de las oportunidades ganadas. */
export function sumarGanado(
  oportunidades: readonly (ConEtapa & ConImporte)[],
): number {
  return sumarImportes(
    oportunidades.filter((oportunidad) => oportunidad.etapa === "ganada"),
  );
}

/**
 * Agrupa las oportunidades por etapa. Están todas las etapas, aunque no tengan
 * ninguna oportunidad, y dentro de cada una se respeta el orden de entrada.
 * Las oportunidades con una etapa desconocida se ignoran.
 */
export function agruparPorEtapa<T extends ConEtapa>(
  oportunidades: readonly T[],
): Record<Etapa, T[]> {
  const grupos: Record<Etapa, T[]> = {
    nuevo: [],
    contactado: [],
    propuesta: [],
    ganada: [],
    perdida: [],
  };
  for (const oportunidad of oportunidades) {
    if (esEtapa(oportunidad.etapa)) {
      grupos[oportunidad.etapa].push(oportunidad);
    }
  }
  return grupos;
}

/** Una columna del tablero: una etapa con sus oportunidades y sus totales. */
export type ColumnaEmbudo<T> = {
  etapa: Etapa;
  etiqueta: string;
  oportunidades: T[];
  cantidad: number;
  /** Suma de los importes de la columna, en euros. */
  total: number;
};

/** Las columnas del tablero, una por etapa y en el orden del embudo. */
export function columnasEmbudo<T extends ConEtapa & ConImporte>(
  oportunidades: readonly T[],
): ColumnaEmbudo<T>[] {
  const grupos = agruparPorEtapa(oportunidades);
  return ETAPAS.map((etapa) => ({
    etapa,
    etiqueta: ETIQUETAS_ETAPA[etapa],
    oportunidades: grupos[etapa],
    cantidad: grupos[etapa].length,
    total: sumarImportes(grupos[etapa]),
  }));
}
