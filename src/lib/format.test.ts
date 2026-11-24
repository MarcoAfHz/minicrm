import { describe, expect, it } from "vitest";
import {
  formatearCantidad,
  formatearEntero,
  formatearEuros,
  formatearFecha,
  formatearMes,
  formatearPorcentaje,
} from "./format";

// Intl usa espacios duros (U+00A0 o U+202F) antes del símbolo €.
function normalizarEspacios(texto: string): string {
  return texto.replace(/[  ]/g, " ");
}

describe("formatearEuros", () => {
  it("formatea un importe con separador de miles y dos decimales", () => {
    expect(normalizarEspacios(formatearEuros(1234.5))).toBe("1.234,50 €");
  });

  it("agrupa también los millones", () => {
    expect(normalizarEspacios(formatearEuros(1234567.89))).toBe(
      "1.234.567,89 €",
    );
  });

  it("formatea el cero", () => {
    expect(normalizarEspacios(formatearEuros(0))).toBe("0,00 €");
  });

  it("formatea importes pequeños sin separador de miles", () => {
    expect(normalizarEspacios(formatearEuros(999.99))).toBe("999,99 €");
  });

  it("redondea a dos decimales", () => {
    expect(normalizarEspacios(formatearEuros(10.456))).toBe("10,46 €");
  });

  it("formatea importes negativos", () => {
    expect(normalizarEspacios(formatearEuros(-50))).toBe("-50,00 €");
  });

  it("devuelve un guion si el número no es válido", () => {
    expect(formatearEuros(Number.NaN)).toBe("—");
    expect(formatearEuros(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatearFecha", () => {
  it("formatea una fecha sin hora como dd/mm/aaaa", () => {
    expect(formatearFecha("2026-03-05")).toBe("05/03/2026");
  });

  it("no cambia de día una fecha sin hora por la zona horaria", () => {
    expect(formatearFecha("2026-01-01")).toBe("01/01/2026");
    expect(formatearFecha("2026-12-31")).toBe("31/12/2026");
  });

  it("formatea un objeto Date en la hora de España", () => {
    expect(formatearFecha(new Date("2026-07-15T10:00:00Z"))).toBe("15/07/2026");
  });

  it("usa la hora de España en fechas con hora cerca de medianoche", () => {
    // 23:30 UTC del 24 de noviembre son las 00:30 del 25 en Madrid.
    expect(formatearFecha("2026-11-24T23:30:00Z")).toBe("25/11/2026");
  });

  it("devuelve un guion si la fecha no es válida", () => {
    expect(formatearFecha("no es una fecha")).toBe("—");
    expect(formatearFecha("")).toBe("—");
    expect(formatearFecha(new Date(Number.NaN))).toBe("—");
  });
});

describe("formatearPorcentaje", () => {
  it("formatea un porcentaje entero en formato español", () => {
    expect(normalizarEspacios(formatearPorcentaje(67))).toBe("67 %");
    expect(normalizarEspacios(formatearPorcentaje(100))).toBe("100 %");
  });

  it("formatea el cero", () => {
    expect(normalizarEspacios(formatearPorcentaje(0))).toBe("0 %");
  });

  it("devuelve un guion si no hay porcentaje", () => {
    expect(formatearPorcentaje(null)).toBe("—");
    expect(formatearPorcentaje(Number.NaN)).toBe("—");
  });
});

describe("formatearMes", () => {
  it("muestra el mes y el año en español", () => {
    expect(formatearMes(new Date("2026-11-24T10:00:00Z"))).toBe(
      "noviembre de 2026",
    );
  });

  it("usa la hora de España en el cambio de mes", () => {
    // 23:30 UTC del 31 de octubre son las 00:30 del 1 de noviembre en Madrid.
    expect(formatearMes(new Date("2026-10-31T23:30:00Z"))).toBe(
      "noviembre de 2026",
    );
  });

  it("devuelve un guion si la fecha no es válida", () => {
    expect(formatearMes(new Date(Number.NaN))).toBe("—");
  });
});

describe("formatearEntero", () => {
  it("agrupa los miles con punto, también con 4 cifras", () => {
    expect(formatearEntero(1234)).toBe("1.234");
    expect(formatearEntero(1234567)).toBe("1.234.567");
  });

  it("formatea el cero y devuelve un guion si no es un número", () => {
    expect(formatearEntero(0)).toBe("0");
    expect(formatearEntero(Number.NaN)).toBe("—");
  });
});

describe("formatearCantidad", () => {
  it("usa el singular solo para 1", () => {
    expect(formatearCantidad(1, "cliente", "clientes")).toBe("1 cliente");
    expect(formatearCantidad(3, "cliente", "clientes")).toBe("3 clientes");
  });

  it("usa el plural para 0", () => {
    expect(formatearCantidad(0, "oportunidad", "oportunidades")).toBe(
      "0 oportunidades",
    );
  });
});
