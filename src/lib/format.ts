/**
 * Zona horaria del negocio: las fechas con hora, "hoy" y "este mes" son los de
 * España. La usan también los cálculos del panel (src/lib/metricas.ts).
 */
export const ZONA_HORARIA = "Europe/Madrid";

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  // En es-ES los números de 4 cifras no se agrupan por defecto (1234,50 €).
  useGrouping: "always",
});

const opcionesFecha: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

// Las fechas sin hora ("2026-03-05") se muestran tal cual, sin desplazarlas
// por la zona horaria. Las fechas con hora se muestran en la hora de España.
const formatoFechaSinHora = new Intl.DateTimeFormat("es-ES", {
  ...opcionesFecha,
  timeZone: "UTC",
});

const formatoFechaConHora = new Intl.DateTimeFormat("es-ES", {
  ...opcionesFecha,
  timeZone: ZONA_HORARIA,
});

const SIN_VALOR = "—";

export function formatearEuros(n: number): string {
  if (!Number.isFinite(n)) {
    return SIN_VALOR;
  }
  return formatoEuros.format(n);
}

export function formatearFecha(fecha: string | Date): string {
  const esSoloFecha =
    typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha);
  const valor = typeof fecha === "string" ? new Date(fecha) : fecha;

  if (Number.isNaN(valor.getTime())) {
    return SIN_VALOR;
  }

  return esSoloFecha
    ? formatoFechaSinHora.format(valor)
    : formatoFechaConHora.format(valor);
}

const formatoPorcentaje = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 0,
});

/** Un porcentaje de 0 a 100 en formato español ("67 %"), o un guion si no hay valor. */
export function formatearPorcentaje(porcentaje: number | null): string {
  if (porcentaje === null || !Number.isFinite(porcentaje)) {
    return SIN_VALOR;
  }
  return formatoPorcentaje.format(porcentaje / 100);
}

const formatoMes = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: ZONA_HORARIA,
});

/** El mes y el año de una fecha en la hora de España ("noviembre de 2026"). */
export function formatearMes(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) {
    return SIN_VALOR;
  }
  return formatoMes.format(fecha);
}

const formatoEntero = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 0,
  useGrouping: "always",
});

/** Un número entero en formato español, con separador de miles ("1.234"). */
export function formatearEntero(n: number): string {
  if (!Number.isFinite(n)) {
    return SIN_VALOR;
  }
  return formatoEntero.format(n);
}

/** Una cantidad con su nombre en singular o en plural ("1 cliente", "3 clientes"). */
export function formatearCantidad(
  cantidad: number,
  singular: string,
  plural: string,
): string {
  return `${formatearEntero(cantidad)} ${cantidad === 1 ? singular : plural}`;
}
