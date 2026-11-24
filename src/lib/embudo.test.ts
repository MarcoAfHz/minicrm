import { describe, expect, it } from "vitest";
import {
  ETAPAS,
  ETAPAS_EN_CURSO,
  ETIQUETAS_ETAPA,
  agruparPorEtapa,
  columnasEmbudo,
  esEtapa,
  importeACentimos,
  importeAEuros,
  sumarEnCurso,
  sumarGanado,
  sumarImportes,
} from "./embudo";

describe("ETAPAS y ETIQUETAS_ETAPA", () => {
  it("siguen el orden del embudo", () => {
    expect(ETAPAS).toEqual([
      "nuevo",
      "contactado",
      "propuesta",
      "ganada",
      "perdida",
    ]);
  });

  it("tienen una etiqueta en español para cada etapa, y ninguna de más", () => {
    expect(Object.keys(ETIQUETAS_ETAPA).sort()).toEqual([...ETAPAS].sort());
    expect(ETAPAS.map((etapa) => ETIQUETAS_ETAPA[etapa])).toEqual([
      "Nuevo",
      "Contactado",
      "Propuesta",
      "Ganada",
      "Perdida",
    ]);
  });
});

describe("esEtapa", () => {
  it("acepta las etapas del embudo", () => {
    for (const etapa of ETAPAS) {
      expect(esEtapa(etapa)).toBe(true);
    }
  });

  it("rechaza cualquier otro valor", () => {
    expect(esEtapa("Ganada")).toBe(false);
    expect(esEtapa("")).toBe(false);
    expect(esEtapa(null)).toBe(false);
    expect(esEtapa(undefined)).toBe(false);
    expect(esEtapa(1)).toBe(false);
  });
});

describe("importeACentimos", () => {
  it("convierte un número en céntimos", () => {
    expect(importeACentimos(1234.56)).toBe(123456);
    expect(importeACentimos(0)).toBe(0);
  });

  it("convierte el texto que puede devolver Supabase para un numeric", () => {
    expect(importeACentimos("1234.56")).toBe(123456);
    expect(importeACentimos("0.10")).toBe(10);
    expect(importeACentimos("1500")).toBe(150000);
  });

  it("no arrastra errores de coma flotante", () => {
    // 4.35 * 100 = 434.99999999999994 en coma flotante.
    expect(importeACentimos(4.35)).toBe(435);
    expect(importeACentimos(1.15)).toBe(115);
  });

  it("aguanta el importe máximo de numeric(12,2) sin perder precisión", () => {
    expect(importeACentimos(9999999999.99)).toBe(999999999999);
    expect(importeACentimos("9999999999.99")).toBe(999999999999);
  });

  it("cuenta como 0 lo que no es un número", () => {
    expect(importeACentimos("")).toBe(0);
    expect(importeACentimos("   ")).toBe(0);
    expect(importeACentimos("abc")).toBe(0);
    expect(importeACentimos(Number.NaN)).toBe(0);
    expect(importeACentimos(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("importeAEuros", () => {
  it("normaliza el importe a euros", () => {
    expect(importeAEuros("1234.50")).toBe(1234.5);
    expect(importeAEuros(99.99)).toBe(99.99);
  });

  it("devuelve 0 si el importe no es válido", () => {
    expect(importeAEuros("no")).toBe(0);
  });
});

describe("sumarImportes", () => {
  it("devuelve 0 con una lista vacía", () => {
    expect(sumarImportes([])).toBe(0);
  });

  it("suma importes con decimales sin errores de coma flotante", () => {
    // En JavaScript, 0.1 + 0.2 === 0.30000000000000004.
    expect(sumarImportes([{ importe: 0.1 }, { importe: 0.2 }])).toBe(0.3);
    expect(
      sumarImportes([{ importe: 0.1 }, { importe: 0.1 }, { importe: 0.1 }]),
    ).toBe(0.3);
  });

  it("mezcla importes en número y en texto", () => {
    expect(
      sumarImportes([
        { importe: 1000 },
        { importe: "234.56" },
        { importe: "0.44" },
      ]),
    ).toBe(1235);
  });

  it("ignora los importes que no son números", () => {
    expect(sumarImportes([{ importe: 10 }, { importe: "x" }])).toBe(10);
  });
});

type Prueba = { id: string; etapa: string; importe: number | string };

const oportunidades: Prueba[] = [
  { id: "a", etapa: "nuevo", importe: 100 },
  { id: "b", etapa: "ganada", importe: "0.1" },
  { id: "c", etapa: "nuevo", importe: 50.5 },
  { id: "d", etapa: "ganada", importe: 0.2 },
  { id: "e", etapa: "archivada", importe: 999 },
];

describe("agruparPorEtapa", () => {
  it("con una lista vacía devuelve todas las etapas vacías", () => {
    expect(agruparPorEtapa([])).toEqual({
      nuevo: [],
      contactado: [],
      propuesta: [],
      ganada: [],
      perdida: [],
    });
  });

  it("agrupa por etapa respetando el orden de entrada", () => {
    const grupos = agruparPorEtapa(oportunidades);

    expect(grupos.nuevo.map((o) => o.id)).toEqual(["a", "c"]);
    expect(grupos.ganada.map((o) => o.id)).toEqual(["b", "d"]);
    expect(grupos.contactado).toEqual([]);
    expect(grupos.propuesta).toEqual([]);
    expect(grupos.perdida).toEqual([]);
  });

  it("si todas están en una etapa, el resto siguen presentes y vacías", () => {
    const grupos = agruparPorEtapa([
      { etapa: "propuesta" },
      { etapa: "propuesta" },
    ]);

    expect(Object.keys(grupos)).toEqual([...ETAPAS]);
    expect(grupos.propuesta).toHaveLength(2);
    expect(grupos.nuevo).toHaveLength(0);
  });

  it("ignora las etapas desconocidas", () => {
    const grupos = agruparPorEtapa([{ etapa: "archivada" }, { etapa: "Nuevo" }]);
    const total = Object.values(grupos).reduce((n, lista) => n + lista.length, 0);

    expect(total).toBe(0);
  });
});

describe("columnasEmbudo", () => {
  it("con una lista vacía devuelve las 5 columnas a cero", () => {
    expect(columnasEmbudo([])).toEqual([
      { etapa: "nuevo", etiqueta: "Nuevo", oportunidades: [], cantidad: 0, total: 0 },
      { etapa: "contactado", etiqueta: "Contactado", oportunidades: [], cantidad: 0, total: 0 },
      { etapa: "propuesta", etiqueta: "Propuesta", oportunidades: [], cantidad: 0, total: 0 },
      { etapa: "ganada", etiqueta: "Ganada", oportunidades: [], cantidad: 0, total: 0 },
      { etapa: "perdida", etiqueta: "Perdida", oportunidades: [], cantidad: 0, total: 0 },
    ]);
  });

  it("cuenta y suma cada columna, sin la etapa desconocida", () => {
    const columnas = columnasEmbudo(oportunidades);

    expect(
      columnas.map(({ etapa, cantidad, total }) => ({ etapa, cantidad, total })),
    ).toEqual([
      { etapa: "nuevo", cantidad: 2, total: 150.5 },
      { etapa: "contactado", cantidad: 0, total: 0 },
      { etapa: "propuesta", cantidad: 0, total: 0 },
      { etapa: "ganada", cantidad: 2, total: 0.3 },
      { etapa: "perdida", cantidad: 0, total: 0 },
    ]);
  });
});

const variadas = [
  { etapa: "nuevo", importe: 0.1 },
  { etapa: "contactado", importe: "0.2" },
  { etapa: "propuesta", importe: 1000 },
  { etapa: "ganada", importe: 500.5 },
  { etapa: "ganada", importe: "0.25" },
  { etapa: "perdida", importe: 9999 },
  { etapa: "archivada", importe: 77 },
];

describe("ETAPAS_EN_CURSO", () => {
  it("son las etapas abiertas, sin ganada ni perdida", () => {
    expect(ETAPAS_EN_CURSO).toEqual(["nuevo", "contactado", "propuesta"]);
  });
});

describe("sumarEnCurso", () => {
  it("devuelve 0 con una lista vacía", () => {
    expect(sumarEnCurso([])).toBe(0);
  });

  it("suma solo nuevo, contactado y propuesta, sin errores de coma flotante", () => {
    expect(sumarEnCurso(variadas)).toBe(1000.3);
  });

  it("devuelve 0 si todas están cerradas", () => {
    expect(
      sumarEnCurso([
        { etapa: "ganada", importe: 10 },
        { etapa: "perdida", importe: 20 },
      ]),
    ).toBe(0);
  });
});

describe("sumarGanado", () => {
  it("devuelve 0 con una lista vacía", () => {
    expect(sumarGanado([])).toBe(0);
  });

  it("suma solo las ganadas, sin contar las perdidas", () => {
    expect(sumarGanado(variadas)).toBe(500.75);
  });

  it("devuelve 0 si no hay ninguna ganada", () => {
    expect(sumarGanado([{ etapa: "perdida", importe: 20 }])).toBe(0);
  });
});
