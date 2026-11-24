import { describe, expect, it } from "vitest";
import {
  LIMITE_PROXIMOS_CIERRES,
  diaEnMadrid,
  esDelMismoMes,
  esVencida,
  estaEnCurso,
  ganadoEnElMes,
  metricasPanel,
  proximosCierres,
  resumenEmbudo,
  resumenEnCurso,
  tasaExito,
} from "./metricas";
import type { Etapa, Importe } from "./tipos";

type Prueba = {
  id: string;
  etapa: Etapa;
  importe: Importe;
  fecha_cierre_prevista: string | null;
  ganada_at: string | null;
};

let siguienteId = 0;

function op(datos: Partial<Prueba> = {}): Prueba {
  siguienteId += 1;
  return {
    id: `op-${siguienteId}`,
    etapa: "nuevo",
    importe: 0,
    fecha_cierre_prevista: null,
    ganada_at: null,
    ...datos,
  };
}

/** Varias oportunidades con la misma etapa. */
function varias(cantidad: number, etapa: Etapa): Prueba[] {
  return Array.from({ length: cantidad }, () => op({ etapa }));
}

// 24 de noviembre de 2026 a mediodía en Madrid (UTC+1).
const AHORA = new Date("2026-11-24T11:00:00Z");

describe("diaEnMadrid", () => {
  it("devuelve el día en la hora de España", () => {
    expect(diaEnMadrid(AHORA)).toBe("2026-11-24");
    expect(diaEnMadrid("2026-07-15T10:00:00+00:00")).toBe("2026-07-15");
  });

  it("pasa al día siguiente a medianoche de Madrid, no de UTC", () => {
    // En invierno Madrid es UTC+1.
    expect(diaEnMadrid("2026-11-24T22:59:59Z")).toBe("2026-11-24");
    expect(diaEnMadrid("2026-11-24T23:00:00Z")).toBe("2026-11-25");
    // En verano Madrid es UTC+2.
    expect(diaEnMadrid("2026-07-14T21:59:59Z")).toBe("2026-07-14");
    expect(diaEnMadrid("2026-07-14T22:00:00Z")).toBe("2026-07-15");
  });

  it("acepta el formato de timestamptz que devuelve Supabase", () => {
    expect(diaEnMadrid("2026-11-24T23:30:00.123456+00:00")).toBe("2026-11-25");
  });

  it("devuelve null si la fecha no es válida", () => {
    expect(diaEnMadrid("")).toBeNull();
    expect(diaEnMadrid("no es una fecha")).toBeNull();
    expect(diaEnMadrid(new Date(Number.NaN))).toBeNull();
  });
});

describe("esDelMismoMes", () => {
  const NOVIEMBRE = new Date("2026-11-15T12:00:00Z");
  const ABRIL = new Date("2026-04-15T12:00:00Z");

  it("octubre → noviembre (horario de invierno, UTC+1)", () => {
    // 31 de octubre a las 23:59:59 en Madrid: todavía es octubre.
    expect(esDelMismoMes("2026-10-31T22:59:59Z", NOVIEMBRE)).toBe(false);
    // 1 de noviembre a las 00:00 en Madrid: ya es noviembre.
    expect(esDelMismoMes("2026-10-31T23:00:00Z", NOVIEMBRE)).toBe(true);
  });

  it("marzo → abril (horario de verano, UTC+2)", () => {
    // 31 de marzo a las 23:59:59 en Madrid.
    expect(esDelMismoMes("2026-03-31T21:59:59Z", ABRIL)).toBe(false);
    // 1 de abril a las 00:00 en Madrid (en UTC sigue siendo 31 de marzo).
    expect(esDelMismoMes("2026-03-31T22:00:00Z", ABRIL)).toBe(true);
    expect(esDelMismoMes("2026-03-31T22:30:00Z", ABRIL)).toBe(true);
  });

  it("el último día del mes cuenta para ese mes y no para el siguiente", () => {
    const OCTUBRE = new Date("2026-10-15T12:00:00Z");
    expect(esDelMismoMes("2026-10-31T22:59:59Z", OCTUBRE)).toBe(true);
    expect(esDelMismoMes("2026-10-31T23:00:00Z", OCTUBRE)).toBe(false);
  });

  it("no se confunde el día del cambio de hora de octubre", () => {
    // 25 de octubre de 2026: a las 03:00 (CEST) vuelven a ser las 02:00 (CET).
    const OCTUBRE = new Date("2026-10-25T01:30:00Z");
    expect(esDelMismoMes("2026-10-25T00:30:00Z", OCTUBRE)).toBe(true);
    expect(esDelMismoMes("2026-10-25T01:30:00Z", OCTUBRE)).toBe(true);
  });

  it("no se confunde el día del cambio de hora de marzo", () => {
    // 29 de marzo de 2026: a las 02:00 (CET) pasan a ser las 03:00 (CEST).
    const MARZO = new Date("2026-03-29T01:30:00Z");
    expect(esDelMismoMes("2026-03-29T00:30:00Z", MARZO)).toBe(true);
    expect(esDelMismoMes("2026-02-28T22:59:59Z", MARZO)).toBe(false);
    expect(esDelMismoMes("2026-02-28T23:00:00Z", MARZO)).toBe(true);
  });

  it("también ajusta «ahora» a la hora de España", () => {
    // Las 23:30 UTC del 31 de octubre ya son 1 de noviembre en Madrid.
    const ahora = new Date("2026-10-31T23:30:00Z");
    expect(esDelMismoMes("2026-11-01T10:00:00Z", ahora)).toBe(true);
    expect(esDelMismoMes("2026-10-31T10:00:00Z", ahora)).toBe(false);
  });

  it("el mismo mes de otro año no cuenta", () => {
    expect(esDelMismoMes("2025-11-15T12:00:00Z", NOVIEMBRE)).toBe(false);
    // Nochevieja: 1 de enero de 2027 a las 00:00 en Madrid.
    expect(esDelMismoMes("2026-12-31T23:00:00Z", new Date("2027-01-10T12:00:00Z"))).toBe(true);
  });

  it("una fecha no válida nunca es del mes", () => {
    expect(esDelMismoMes("", NOVIEMBRE)).toBe(false);
    expect(esDelMismoMes("no es una fecha", NOVIEMBRE)).toBe(false);
    expect(esDelMismoMes("2026-11-15T12:00:00Z", new Date(Number.NaN))).toBe(false);
  });
});

describe("estaEnCurso", () => {
  it("las etapas abiertas están en curso", () => {
    expect(estaEnCurso("nuevo")).toBe(true);
    expect(estaEnCurso("contactado")).toBe(true);
    expect(estaEnCurso("propuesta")).toBe(true);
  });

  it("las cerradas y las desconocidas no", () => {
    expect(estaEnCurso("ganada")).toBe(false);
    expect(estaEnCurso("perdida")).toBe(false);
    expect(estaEnCurso("")).toBe(false);
    expect(estaEnCurso("Nuevo")).toBe(false);
  });
});

describe("resumenEnCurso", () => {
  it("cuenta y suma solo las oportunidades abiertas", () => {
    const oportunidades = [
      op({ etapa: "nuevo", importe: "100.10" }),
      op({ etapa: "contactado", importe: 200.2 }),
      op({ etapa: "propuesta", importe: "0.00" }),
      op({ etapa: "ganada", importe: 5000 }),
      op({ etapa: "perdida", importe: 7000 }),
    ];
    expect(resumenEnCurso(oportunidades)).toEqual({
      cantidad: 3,
      total: 300.3,
    });
  });

  it("sin oportunidades es cero", () => {
    expect(resumenEnCurso([])).toEqual({ cantidad: 0, total: 0 });
  });
});

describe("ganadoEnElMes", () => {
  it("suma las ganadas cuyo ganada_at cae en el mes actual de Madrid", () => {
    const oportunidades = [
      op({ etapa: "ganada", importe: "1000.10", ganada_at: "2026-11-01T09:00:00+00:00" }),
      op({ etapa: "ganada", importe: 0.2, ganada_at: "2026-11-24T10:00:00+00:00" }),
      // Ganada el mes pasado.
      op({ etapa: "ganada", importe: 500, ganada_at: "2026-10-20T10:00:00+00:00" }),
      // Con ganada_at de este mes pero ya no ganadas (el trigger lo pondría a
      // null; aun así, la etapa manda).
      op({ etapa: "perdida", importe: 300, ganada_at: "2026-11-05T10:00:00+00:00" }),
      op({ etapa: "propuesta", importe: 300, ganada_at: "2026-11-05T10:00:00+00:00" }),
    ];
    expect(ganadoEnElMes(oportunidades, AHORA)).toEqual({
      cantidad: 2,
      total: 1000.3,
    });
  });

  it("respeta el límite del mes en la hora de España", () => {
    const oportunidades = [
      // 31 de octubre, 23:59:59 en Madrid: no es de noviembre.
      op({ etapa: "ganada", importe: 100, ganada_at: "2026-10-31T22:59:59+00:00" }),
      // 1 de noviembre, 00:00 en Madrid: sí.
      op({ etapa: "ganada", importe: 10, ganada_at: "2026-10-31T23:00:00+00:00" }),
    ];
    expect(ganadoEnElMes(oportunidades, AHORA)).toEqual({
      cantidad: 1,
      total: 10,
    });
  });

  it("sin ganadas este mes es cero", () => {
    expect(ganadoEnElMes([], AHORA)).toEqual({ cantidad: 0, total: 0 });
    expect(
      ganadoEnElMes([op({ etapa: "ganada", importe: 100, ganada_at: "" })], AHORA),
    ).toEqual({ cantidad: 0, total: 0 });
  });

  it("una ganada sin ganada_at no cuenta", () => {
    expect(
      ganadoEnElMes([op({ etapa: "ganada", importe: 100, ganada_at: null })], AHORA),
    ).toEqual({ cantidad: 0, total: 0 });
  });
});

describe("tasaExito", () => {
  it("sin oportunidades no divide entre cero", () => {
    expect(tasaExito([])).toEqual({ ganadas: 0, perdidas: 0, porcentaje: null });
  });

  it("con solo oportunidades abiertas tampoco hay tasa", () => {
    expect(tasaExito(varias(3, "propuesta"))).toEqual({
      ganadas: 0,
      perdidas: 0,
      porcentaje: null,
    });
  });

  it("solo ganadas es el 100 %", () => {
    expect(tasaExito(varias(2, "ganada"))).toEqual({
      ganadas: 2,
      perdidas: 0,
      porcentaje: 100,
    });
  });

  it("solo perdidas es el 0 %", () => {
    expect(tasaExito(varias(3, "perdida"))).toEqual({
      ganadas: 0,
      perdidas: 3,
      porcentaje: 0,
    });
  });

  it("con una mezcla, las abiertas no cuentan", () => {
    const oportunidades = [
      ...varias(1, "ganada"),
      ...varias(3, "perdida"),
      ...varias(5, "nuevo"),
    ];
    expect(tasaExito(oportunidades)).toEqual({
      ganadas: 1,
      perdidas: 3,
      porcentaje: 25,
    });
  });

  it("redondea al entero más cercano", () => {
    expect(tasaExito([...varias(2, "ganada"), ...varias(1, "perdida")]).porcentaje).toBe(67);
    expect(tasaExito([...varias(1, "ganada"), ...varias(2, "perdida")]).porcentaje).toBe(33);
    // 1 de 8 = 12,5 % → 13 %.
    expect(tasaExito([...varias(1, "ganada"), ...varias(7, "perdida")]).porcentaje).toBe(13);
  });

  it("no redondea a 100 % si hay alguna perdida ni a 0 % si hay alguna ganada", () => {
    expect(tasaExito([...varias(199, "ganada"), ...varias(1, "perdida")]).porcentaje).toBe(99);
    expect(tasaExito([...varias(1, "ganada"), ...varias(250, "perdida")]).porcentaje).toBe(1);
  });
});

describe("esVencida", () => {
  it("vence si la fecha es anterior a hoy", () => {
    expect(esVencida("2026-11-23", "2026-11-24")).toBe(true);
    expect(esVencida("2025-12-31", "2026-01-01")).toBe(true);
  });

  it("la fecha de hoy y las futuras no han vencido", () => {
    expect(esVencida("2026-11-24", "2026-11-24")).toBe(false);
    expect(esVencida("2026-11-25", "2026-11-24")).toBe(false);
  });

  it("sin fecha o con una fecha no válida nunca vence", () => {
    expect(esVencida(null, "2026-11-24")).toBe(false);
    expect(esVencida("", "2026-11-24")).toBe(false);
    expect(esVencida("ayer", "2026-11-24")).toBe(false);
  });
});

describe("proximosCierres", () => {
  it("devuelve como mucho 5, la fecha más cercana primero", () => {
    const fechas = [
      "2026-12-20",
      "2026-11-30",
      "2026-12-01",
      "2027-01-15",
      "2026-11-25",
      "2026-12-10",
      "2026-11-24",
    ];
    const resultado = proximosCierres(
      fechas.map((fecha) => op({ fecha_cierre_prevista: fecha })),
      AHORA,
    );
    expect(LIMITE_PROXIMOS_CIERRES).toBe(5);
    expect(resultado.map((o) => o.fecha_cierre_prevista)).toEqual([
      "2026-11-24",
      "2026-11-25",
      "2026-11-30",
      "2026-12-01",
      "2026-12-10",
    ]);
  });

  it("solo incluye oportunidades abiertas", () => {
    const resultado = proximosCierres(
      [
        op({ etapa: "ganada", fecha_cierre_prevista: "2026-11-25" }),
        op({ etapa: "perdida", fecha_cierre_prevista: "2026-11-25" }),
        op({ etapa: "contactado", fecha_cierre_prevista: "2026-12-01" }),
      ],
      AHORA,
    );
    expect(resultado.map((o) => o.etapa)).toEqual(["contactado"]);
  });

  it("deja al final las que no tienen fecha", () => {
    const sinFecha = op({ fecha_cierre_prevista: null });
    const conFecha = op({ fecha_cierre_prevista: "2027-06-01" });
    const resultado = proximosCierres([sinFecha, conFecha], AHORA);
    expect(resultado.map((o) => o.id)).toEqual([conFecha.id, sinFecha.id]);
  });

  it("si hay 5 con fecha, las que no tienen fecha se quedan fuera", () => {
    const sinFecha = op({ fecha_cierre_prevista: null });
    const conFecha = Array.from({ length: 5 }, (_, i) =>
      op({ fecha_cierre_prevista: `2026-12-0${i + 1}` }),
    );
    const resultado = proximosCierres([sinFecha, ...conFecha], AHORA);
    expect(resultado).toHaveLength(5);
    expect(resultado.map((o) => o.id)).not.toContain(sinFecha.id);
  });

  it("con la misma fecha respeta el orden de entrada", () => {
    const a = op({ fecha_cierre_prevista: "2026-12-01" });
    const b = op({ fecha_cierre_prevista: "2026-12-01" });
    const c = op({ fecha_cierre_prevista: null });
    const d = op({ fecha_cierre_prevista: null });
    expect(proximosCierres([c, a, d, b], AHORA).map((o) => o.id)).toEqual([
      a.id,
      b.id,
      c.id,
      d.id,
    ]);
  });

  it("marca como vencidas las anteriores a hoy (hoy en Madrid)", () => {
    const resultado = proximosCierres(
      [
        op({ fecha_cierre_prevista: "2026-11-23" }),
        op({ fecha_cierre_prevista: "2026-11-24" }),
        op({ fecha_cierre_prevista: null }),
      ],
      AHORA,
    );
    expect(resultado.map((o) => o.vencida)).toEqual([true, false, false]);
  });

  it("a las 00:30 de Madrid ya ha cambiado el día aunque en UTC no", () => {
    // 23:30 UTC del 24 de noviembre = 00:30 del 25 en Madrid.
    const ahora = new Date("2026-11-24T23:30:00Z");
    const [oportunidad] = proximosCierres(
      [op({ fecha_cierre_prevista: "2026-11-24" })],
      ahora,
    );
    expect(oportunidad?.vencida).toBe(true);
  });

  it("no modifica la lista de entrada", () => {
    const entrada = [
      op({ fecha_cierre_prevista: "2026-12-10" }),
      op({ fecha_cierre_prevista: "2026-12-01" }),
    ];
    const copia = [...entrada];
    proximosCierres(entrada, AHORA);
    expect(entrada).toEqual(copia);
  });

  it("sin oportunidades, o con límite 0, devuelve una lista vacía", () => {
    expect(proximosCierres([], AHORA)).toEqual([]);
    expect(proximosCierres([op({ fecha_cierre_prevista: "2026-12-01" })], AHORA, 0)).toEqual([]);
  });
});

describe("resumenEmbudo", () => {
  it("da el número y el importe de cada etapa, en el orden del embudo", () => {
    const resumen = resumenEmbudo([
      op({ etapa: "nuevo", importe: "100.10" }),
      op({ etapa: "nuevo", importe: "0.20" }),
      op({ etapa: "propuesta", importe: 50 }),
      op({ etapa: "ganada", importe: 1000 }),
      op({ etapa: "ganada", importe: 1000 }),
      op({ etapa: "ganada", importe: 1000 }),
      op({ etapa: "ganada", importe: 1000 }),
    ]);
    expect(resumen).toEqual([
      { etapa: "nuevo", etiqueta: "Nuevo", cantidad: 2, total: 100.3, ancho: 50 },
      { etapa: "contactado", etiqueta: "Contactado", cantidad: 0, total: 0, ancho: 0 },
      { etapa: "propuesta", etiqueta: "Propuesta", cantidad: 1, total: 50, ancho: 25 },
      { etapa: "ganada", etiqueta: "Ganada", cantidad: 4, total: 4000, ancho: 100 },
      { etapa: "perdida", etiqueta: "Perdida", cantidad: 0, total: 0, ancho: 0 },
    ]);
  });

  it("sin oportunidades, todas las etapas a cero y sin dividir entre cero", () => {
    const resumen = resumenEmbudo([]);
    expect(resumen).toHaveLength(5);
    for (const etapa of resumen) {
      expect(etapa).toMatchObject({ cantidad: 0, total: 0, ancho: 0 });
    }
  });

  it("una etapa con alguna oportunidad tiene al menos 1 de ancho", () => {
    const resumen = resumenEmbudo([...varias(300, "nuevo"), ...varias(1, "perdida")]);
    expect(resumen.find((e) => e.etapa === "perdida")?.ancho).toBe(1);
  });
});

describe("metricasPanel", () => {
  it("reúne todas las cifras del panel", () => {
    const oportunidades = [
      op({ etapa: "propuesta", importe: 300, fecha_cierre_prevista: "2026-11-20" }),
      op({ etapa: "ganada", importe: 1000, ganada_at: "2026-11-02T10:00:00+00:00" }),
      op({ etapa: "perdida", importe: 200 }),
    ];
    const metricas = metricasPanel(oportunidades, 4, AHORA);

    expect(metricas.enCurso).toEqual({ cantidad: 1, total: 300 });
    expect(metricas.ganadoEsteMes).toEqual({ cantidad: 1, total: 1000 });
    expect(metricas.tasaExito.porcentaje).toBe(50);
    expect(metricas.clientes).toBe(4);
    expect(metricas.proximosCierres).toHaveLength(1);
    expect(metricas.proximosCierres[0]?.vencida).toBe(true);
    expect(metricas.embudo).toHaveLength(5);
  });

  it("sin datos no divide entre cero", () => {
    const metricas = metricasPanel([], 0, AHORA);

    expect(metricas.enCurso).toEqual({ cantidad: 0, total: 0 });
    expect(metricas.ganadoEsteMes).toEqual({ cantidad: 0, total: 0 });
    expect(metricas.tasaExito.porcentaje).toBeNull();
    expect(metricas.clientes).toBe(0);
    expect(metricas.proximosCierres).toEqual([]);
    expect(metricas.embudo.every((e) => e.ancho === 0)).toBe(true);
  });

  it("un número de clientes no válido cuenta como 0", () => {
    expect(metricasPanel([], Number.NaN, AHORA).clientes).toBe(0);
    expect(metricasPanel([], -1, AHORA).clientes).toBe(0);
  });
});
