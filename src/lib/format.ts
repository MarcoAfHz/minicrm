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
  timeZone: "Europe/Madrid",
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
