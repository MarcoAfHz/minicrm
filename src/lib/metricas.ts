import {
  ETAPAS_EN_CURSO,
  columnasEmbudo,
  sumarEnCurso,
  sumarGanado,
} from "@/lib/embudo";
import { ZONA_HORARIA } from "@/lib/format";
import type { Etapa, Importe } from "@/lib/tipos";

// Cálculos del panel. Son funciones puras: el instante actual ("ahora") se
// recibe como parámetro para poder probar los límites de mes y de día.

/** Cuántas oportunidades se muestran en «Próximos cierres». */
export const LIMITE_PROXIMOS_CIERRES = 5;

const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const PATRON_FECHA_SIN_HORA = /^\d{4}-\d{2}-\d{2}$/;

/** Lo mínimo que necesitan los cálculos de cada oportunidad. */
type ConEtapa = { etapa: string };
type ConImporte = { importe: Importe };
type ConFechaCierre = { fecha_cierre_prevista: string | null };
type ConGanadaAt = { ganada_at: string | null };

/**
 * El día natural (AAAA-MM-DD) en que cae un instante en la hora de España, o
 * null si la fecha no es válida. Tiene en cuenta el horario de verano.
 */
export function diaEnMadrid(instante: Date | string): string | null {
  const fecha = typeof instante === "string" ? new Date(instante) : instante;
  if (Number.isNaN(fecha.getTime())) {
    return null;
  }
  const partes = formatoDia.formatToParts(fecha);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? "";
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

/**
 * Si un instante (por ejemplo, un timestamptz de Supabase) cae en el mismo mes
 * natural que "ahora", los dos en la hora de España.
 */
export function esDelMismoMes(instante: string, ahora: Date): boolean {
  const dia = diaEnMadrid(instante);
  const hoy = diaEnMadrid(ahora);
  if (dia === null || hoy === null) {
    return false;
  }
  return dia.slice(0, 7) === hoy.slice(0, 7);
}

/** Si la oportunidad sigue abierta (ni ganada ni perdida). */
export function estaEnCurso(etapa: string): boolean {
  return ETAPAS_EN_CURSO.some((enCurso) => enCurso === etapa);
}

/** Número de oportunidades y suma de importes, en euros. */
export type Resumen = { cantidad: number; total: number };

/** Las oportunidades abiertas: cuántas hay y cuánto suman. */
export function resumenEnCurso(
  oportunidades: readonly (ConEtapa & ConImporte)[],
): Resumen {
  return {
    cantidad: oportunidades.filter((o) => estaEnCurso(o.etapa)).length,
    total: sumarEnCurso(oportunidades),
  };
}

/**
 * Las oportunidades ganadas este mes (mes natural de "ahora" en Europe/Madrid):
 * cuántas hay y cuánto suman. Cuenta `ganada_at`, el momento en que pasaron a
 * «ganada» (lo pone un trigger de la base de datos y no cambia al editar otros
 * campos). Una ganada sin `ganada_at` no cuenta.
 */
export function ganadoEnElMes(
  oportunidades: readonly (ConEtapa & ConImporte & ConGanadaAt)[],
  ahora: Date,
): Resumen {
  const ganadas = oportunidades.filter(
    (o) =>
      o.etapa === "ganada" &&
      o.ganada_at !== null &&
      esDelMismoMes(o.ganada_at, ahora),
  );
  return { cantidad: ganadas.length, total: sumarGanado(ganadas) };
}

export type TasaExito = {
  ganadas: number;
  perdidas: number;
  /** Porcentaje entero de 0 a 100, o null si no hay oportunidades cerradas. */
  porcentaje: number | null;
};

/**
 * Tasa de éxito: ganadas / (ganadas + perdidas), en porcentaje entero. Sin
 * oportunidades cerradas no se divide entre cero: el porcentaje es null.
 *
 * El redondeo nunca da 100 % si hay alguna perdida ni 0 % si hay alguna ganada
 * (199 de 200 es 99 %, no 100 %), para no dar una impresión falsa.
 */
export function tasaExito(oportunidades: readonly ConEtapa[]): TasaExito {
  const ganadas = oportunidades.filter((o) => o.etapa === "ganada").length;
  const perdidas = oportunidades.filter((o) => o.etapa === "perdida").length;
  const cerradas = ganadas + perdidas;
  if (cerradas === 0) {
    return { ganadas, perdidas, porcentaje: null };
  }

  let porcentaje = Math.round((ganadas * 100) / cerradas);
  if (perdidas > 0) {
    porcentaje = Math.min(porcentaje, 99);
  }
  if (ganadas > 0) {
    porcentaje = Math.max(porcentaje, 1);
  }
  return { ganadas, perdidas, porcentaje };
}

/** La fecha sin hora (AAAA-MM-DD) si tiene ese formato; si no, null. */
function fechaSinHora(fecha: string | null): string | null {
  return fecha !== null && PATRON_FECHA_SIN_HORA.test(fecha) ? fecha : null;
}

/**
 * Si una fecha de cierre prevista (AAAA-MM-DD) ya ha pasado: es anterior a
 * `hoy` (AAAA-MM-DD). La de hoy todavía no ha vencido. Sin fecha, nunca vence.
 */
export function esVencida(fecha: string | null, hoy: string): boolean {
  const dia = fechaSinHora(fecha);
  return dia !== null && dia < hoy;
}

/**
 * Las próximas oportunidades abiertas por fecha de cierre prevista (la más
 * cercana primero; las vencidas, que son las más antiguas, quedan arriba). Las
 * que no tienen fecha van al final. Con la misma fecha se respeta el orden de
 * entrada. "Hoy" es el día de "ahora" en Europe/Madrid.
 */
export function proximosCierres<T extends ConEtapa & ConFechaCierre>(
  oportunidades: readonly T[],
  ahora: Date,
  limite: number = LIMITE_PROXIMOS_CIERRES,
): (T & { vencida: boolean })[] {
  const hoy = diaEnMadrid(ahora) ?? "";
  return oportunidades
    .filter((o) => estaEnCurso(o.etapa))
    // filter ya devuelve una copia: ordenarla no cambia la lista de entrada.
    .sort(compararFechas)
    .slice(0, Math.max(0, limite))
    .map((o) => ({ ...o, vencida: esVencida(o.fecha_cierre_prevista, hoy) }));
}

function compararFechas(a: ConFechaCierre, b: ConFechaCierre): number {
  const fechaA = fechaSinHora(a.fecha_cierre_prevista);
  const fechaB = fechaSinHora(b.fecha_cierre_prevista);
  if (fechaA === fechaB) {
    return 0;
  }
  if (fechaA === null) {
    return 1;
  }
  if (fechaB === null) {
    return -1;
  }
  return fechaA < fechaB ? -1 : 1;
}

/** Una fila del resumen del embudo. */
export type EtapaResumen = {
  etapa: Etapa;
  etiqueta: string;
  cantidad: number;
  /** Suma de los importes de la etapa, en euros. */
  total: number;
  /**
   * Ancho de la barra, de 0 a 100: el número de oportunidades de la etapa
   * respecto a la etapa con más. Si la etapa tiene alguna, como mínimo 1, para
   * que se vea.
   */
  ancho: number;
};

/** Número de oportunidades e importe de cada etapa, en el orden del embudo. */
export function resumenEmbudo(
  oportunidades: readonly (ConEtapa & ConImporte)[],
): EtapaResumen[] {
  const columnas = columnasEmbudo(oportunidades);
  const maximo = Math.max(0, ...columnas.map((c) => c.cantidad));
  return columnas.map(({ etapa, etiqueta, cantidad, total }) => ({
    etapa,
    etiqueta,
    cantidad,
    total,
    ancho:
      cantidad === 0 ? 0 : Math.max(1, Math.round((cantidad * 100) / maximo)),
  }));
}

export type MetricasPanel<T> = {
  enCurso: Resumen;
  ganadoEsteMes: Resumen;
  tasaExito: TasaExito;
  clientes: number;
  proximosCierres: (T & { vencida: boolean })[];
  embudo: EtapaResumen[];
};

/** Todas las cifras del panel a partir de las oportunidades y del número de clientes. */
export function metricasPanel<
  T extends ConEtapa & ConImporte & ConFechaCierre & ConGanadaAt,
>(oportunidades: readonly T[], clientes: number, ahora: Date): MetricasPanel<T> {
  return {
    enCurso: resumenEnCurso(oportunidades),
    ganadoEsteMes: ganadoEnElMes(oportunidades, ahora),
    tasaExito: tasaExito(oportunidades),
    clientes: Number.isFinite(clientes) ? Math.max(0, clientes) : 0,
    proximosCierres: proximosCierres(oportunidades, ahora),
    embudo: resumenEmbudo(oportunidades),
  };
}
