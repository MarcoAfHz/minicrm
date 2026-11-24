import { describe, expect, it } from "vitest";
import {
  LIMITES_OPORTUNIDAD,
  esFechaValida,
  esIdOportunidad,
  esquemaOportunidad,
  importeATexto,
  interpretarImporte,
  leerFormularioOportunidad,
  validarCambioEtapa,
  validarOportunidad,
  volverAlCliente,
} from "./oportunidad";

const ID_CLIENTE = "3f2b8c1e-9d4a-4c6b-8e2f-1a2b3c4d5e6f";

const oportunidadCompleta = {
  cliente_id: ID_CLIENTE,
  titulo: "Renovación de licencias",
  importe: "1.234,56",
  etapa: "propuesta",
  fecha_cierre_prevista: "2026-12-31",
};

function errores(entrada: Record<string, unknown>) {
  const resultado = validarOportunidad({ ...oportunidadCompleta, ...entrada });
  return resultado.ok ? {} : resultado.errores;
}

function importe(texto: string) {
  const resultado = interpretarImporte(texto);
  return resultado.ok ? resultado.importe : resultado.error;
}

describe("interpretarImporte", () => {
  it("acepta el formato español con miles y decimales", () => {
    expect(importe("1.234,56")).toBe(1234.56);
    expect(importe("1.234.567,8")).toBe(1234567.8);
  });

  it("acepta la coma decimal sin separador de miles", () => {
    expect(importe("1234,56")).toBe(1234.56);
    expect(importe("0,5")).toBe(0.5);
  });

  it("acepta el punto decimal", () => {
    expect(importe("1234.56")).toBe(1234.56);
    expect(importe("1.5")).toBe(1.5);
  });

  it("con solo puntos en grupos de 3 cifras los lee como miles", () => {
    expect(importe("1.234")).toBe(1234);
    expect(importe("12.345.678")).toBe(12345678);
  });

  it("acepta enteros, espacios y el símbolo €", () => {
    expect(importe("1500")).toBe(1500);
    expect(importe(" 1 500 € ")).toBe(1500);
    expect(importe("1.234,50 €")).toBe(1234.5);
  });

  it("vacío cuenta como 0", () => {
    expect(importe("")).toBe(0);
    expect(importe("   ")).toBe(0);
  });

  it("acepta el cero", () => {
    expect(importe("0")).toBe(0);
    expect(importe("0,00")).toBe(0);
  });

  it("no arrastra errores de coma flotante", () => {
    expect(importe("0,1")).toBe(0.1);
    expect(importe("4,35")).toBe(4.35);
  });

  it("rechaza importes negativos", () => {
    expect(importe("-5")).toBe("El importe no puede ser negativo.");
    expect(importe("-1.234,56")).toBe("El importe no puede ser negativo.");
  });

  it("rechaza más de 2 decimales", () => {
    expect(importe("1,234")).toBe(
      "El importe puede tener como máximo 2 decimales.",
    );
    expect(importe("1234.567")).toBe(
      "El importe puede tener como máximo 2 decimales.",
    );
  });

  it("acepta el máximo de numeric(12,2) y rechaza lo que no cabe", () => {
    expect(importe("9.999.999.999,99")).toBe(LIMITES_OPORTUNIDAD.importeMaximo);
    expect(importe("9999999999.99")).toBe(9999999999.99);
    expect(importe("10.000.000.000")).toBe(
      "El importe no puede ser mayor que 9.999.999.999,99 €.",
    );
    expect(importe("99999999999")).toBe(
      "El importe no puede ser mayor que 9.999.999.999,99 €.",
    );
  });

  it("no lee como miles un primer grupo que empieza por 0", () => {
    const decimales = "El importe puede tener como máximo 2 decimales.";
    // "0.500" no son 500 €: con 3 decimales, se pide corregirlo.
    expect(importe("0.500")).toBe(decimales);
    expect(importe("0.234")).toBe(decimales);
    expect(importe("00.123")).toBe(decimales);
    expect(importe("0.50")).toBe(0.5);
    expect(importe("0.500,00")).toBe(
      "Escribe un importe válido, por ejemplo 1.234,56.",
    );
  });

  it("no cuenta los ceros a la izquierda como cifras", () => {
    expect(importe("0001500")).toBe(1500);
    expect(importe("0009999999999")).toBe(9999999999);
  });

  it("rechaza lo que no es un importe", () => {
    const noValido = "Escribe un importe válido, por ejemplo 1.234,56.";
    expect(importe("abc")).toBe(noValido);
    expect(importe("12a")).toBe(noValido);
    expect(importe("1,2,3")).toBe(noValido);
    expect(importe("1.2.3")).toBe(noValido);
    expect(importe("1,234.56")).toBe(noValido);
    expect(importe("12.34.567,8")).toBe(noValido);
    expect(importe("12,")).toBe(noValido);
    expect(importe("12.")).toBe(noValido);
    expect(importe(",5")).toBe(noValido);
    expect(importe("1e3")).toBe(noValido);
    expect(importe("-")).toBe(noValido);
    expect(importe("-abc")).toBe(noValido);
  });
});

describe("importeATexto", () => {
  it("escribe el importe como en el formulario", () => {
    expect(importeATexto(1234.5)).toBe("1234,50");
    expect(importeATexto("1234.56")).toBe("1234,56");
    expect(importeATexto(0.1)).toBe("0,10");
  });

  it("escribe el cero y los enteros con dos decimales", () => {
    expect(importeATexto(0)).toBe("0,00");
    expect(importeATexto(1500)).toBe("1500,00");
  });

  it("lo que escribe se vuelve a leer igual", () => {
    expect(importe(importeATexto(9999999999.99))).toBe(9999999999.99);
  });
});

describe("esFechaValida", () => {
  it("acepta una fecha YYYY-MM-DD que existe", () => {
    expect(esFechaValida("2026-12-31")).toBe(true);
    expect(esFechaValida("2028-02-29")).toBe(true);
  });

  it("rechaza fechas que no existen", () => {
    expect(esFechaValida("2026-02-29")).toBe(false);
    expect(esFechaValida("2026-02-30")).toBe(false);
    expect(esFechaValida("2026-13-01")).toBe(false);
    expect(esFechaValida("2026-00-10")).toBe(false);
    expect(esFechaValida("0000-01-01")).toBe(false);
  });

  it("rechaza otros formatos", () => {
    expect(esFechaValida("31/12/2026")).toBe(false);
    expect(esFechaValida("2026-1-5")).toBe(false);
    expect(esFechaValida("2026-12-31T00:00:00Z")).toBe(false);
    expect(esFechaValida("")).toBe(false);
  });
});

describe("esquemaOportunidad", () => {
  it("acepta una oportunidad completa y convierte el importe a número", () => {
    expect(esquemaOportunidad.parse(oportunidadCompleta)).toEqual({
      cliente_id: ID_CLIENTE,
      titulo: "Renovación de licencias",
      importe: 1234.56,
      etapa: "propuesta",
      fecha_cierre_prevista: "2026-12-31",
    });
  });

  it("sin importe ni fecha guarda 0 y null, y quita los espacios", () => {
    expect(
      esquemaOportunidad.parse({
        cliente_id: ` ${ID_CLIENTE} `,
        titulo: "  Web nueva  ",
        importe: "",
        etapa: "nuevo",
        fecha_cierre_prevista: "",
      }),
    ).toEqual({
      cliente_id: ID_CLIENTE,
      titulo: "Web nueva",
      importe: 0,
      etapa: "nuevo",
      fecha_cierre_prevista: null,
    });
  });
});

describe("validarOportunidad", () => {
  it("devuelve los datos limpios si todo es correcto", () => {
    expect(validarOportunidad(oportunidadCompleta)).toMatchObject({ ok: true });
  });

  it("pide el cliente y que sea un id válido", () => {
    expect(errores({ cliente_id: "" }).cliente_id).toBe("Elige un cliente.");
    expect(errores({ cliente_id: null }).cliente_id).toBe("Elige un cliente.");
    expect(errores({ cliente_id: "1 or 1=1" }).cliente_id).toBe(
      "Elige un cliente de la lista.",
    );
  });

  it("pide el título", () => {
    expect(errores({ titulo: "" }).titulo).toBe(
      "Escribe el título de la oportunidad.",
    );
    expect(errores({ titulo: "   " }).titulo).toBe(
      "Escribe el título de la oportunidad.",
    );
  });

  it("exige entre 2 y 120 caracteres en el título", () => {
    expect(errores({ titulo: "A" }).titulo).toBe(
      "El título tiene que tener al menos 2 caracteres.",
    );
    expect(errores({ titulo: "Ab" }).titulo).toBeUndefined();
    expect(errores({ titulo: "t".repeat(120) }).titulo).toBeUndefined();
    expect(errores({ titulo: "t".repeat(121) }).titulo).toBe(
      "El título no puede tener más de 120 caracteres.",
    );
  });

  it("cuenta caracteres y no unidades UTF-16, igual que char_length", () => {
    expect(errores({ titulo: "😀" }).titulo).toBe(
      "El título tiene que tener al menos 2 caracteres.",
    );
    expect(errores({ titulo: "😀".repeat(120) }).titulo).toBeUndefined();
    expect(errores({ titulo: "😀".repeat(121) }).titulo).toBe(
      "El título no puede tener más de 120 caracteres.",
    );
  });

  it("devuelve el motivo si el importe no vale", () => {
    expect(errores({ importe: "-3" }).importe).toBe(
      "El importe no puede ser negativo.",
    );
    expect(errores({ importe: "3,456" }).importe).toBe(
      "El importe puede tener como máximo 2 decimales.",
    );
  });

  it("solo acepta las etapas del embudo", () => {
    expect(errores({ etapa: "ganada" }).etapa).toBeUndefined();
    expect(errores({ etapa: "Ganada" }).etapa).toBe("Elige una etapa válida.");
    expect(errores({ etapa: "" }).etapa).toBe("Elige una etapa válida.");
    expect(errores({ etapa: null }).etapa).toBe("Elige una etapa válida.");
  });

  it("rechaza una fecha de cierre que no existe", () => {
    expect(errores({ fecha_cierre_prevista: "2026-02-30" }).fecha_cierre_prevista).toBe(
      "Introduce una fecha válida.",
    );
    expect(errores({ fecha_cierre_prevista: "mañana" }).fecha_cierre_prevista).toBe(
      "Introduce una fecha válida.",
    );
  });

  it("devuelve un error por cada campo incorrecto", () => {
    expect(
      errores({ cliente_id: "", titulo: "", importe: "x", etapa: "otra" }),
    ).toEqual({
      cliente_id: "Elige un cliente.",
      titulo: "Escribe el título de la oportunidad.",
      importe: "Escribe un importe válido, por ejemplo 1.234,56.",
      etapa: "Elige una etapa válida.",
    });
  });

  it("no acepta una entrada que no sea un objeto", () => {
    expect(validarOportunidad(null).ok).toBe(false);
  });
});

describe("esIdOportunidad", () => {
  it("acepta un uuid", () => {
    expect(esIdOportunidad(ID_CLIENTE)).toBe(true);
  });

  it("rechaza lo que no es un uuid", () => {
    expect(esIdOportunidad("123")).toBe(false);
    expect(esIdOportunidad("")).toBe(false);
    expect(esIdOportunidad(null)).toBe(false);
  });
});

describe("validarCambioEtapa", () => {
  it("acepta un id y una etapa del embudo", () => {
    expect(validarCambioEtapa({ id: ID_CLIENTE, etapa: "ganada" })).toEqual({
      ok: true,
      datos: { id: ID_CLIENTE, etapa: "ganada" },
    });
  });

  it("rechaza una etapa desconocida", () => {
    expect(validarCambioEtapa({ id: ID_CLIENTE, etapa: "archivada" })).toEqual({
      ok: false,
      error: "Elige una etapa válida.",
    });
  });

  it("rechaza un id que no es un uuid", () => {
    expect(validarCambioEtapa({ id: "abc", etapa: "ganada" })).toEqual({
      ok: false,
      error: "La oportunidad no es válida.",
    });
  });

  it("da un mensaje en español aunque la entrada no sea un objeto", () => {
    expect(validarCambioEtapa(null)).toEqual({
      ok: false,
      error: "Elige una etapa válida.",
    });
  });
});

describe("leerFormularioOportunidad", () => {
  it("lee cada campo del formulario", () => {
    const formData = new FormData();
    for (const [campo, valor] of Object.entries(oportunidadCompleta)) {
      formData.set(campo, valor);
    }
    formData.set("otro", "se ignora");

    expect(leerFormularioOportunidad(formData)).toEqual(oportunidadCompleta);
  });

  it("deja vacíos los campos que faltan o que no son texto", () => {
    const formData = new FormData();
    formData.set("titulo", new Blob(["x"]));

    expect(leerFormularioOportunidad(formData)).toEqual({
      cliente_id: "",
      titulo: "",
      importe: "",
      etapa: "",
      fecha_cierre_prevista: "",
    });
  });
});

describe("volverAlCliente", () => {
  it("solo es cierto con el valor «cliente»", () => {
    expect(volverAlCliente("cliente")).toBe(true);
  });

  it("cualquier otro valor vuelve al tablero", () => {
    expect(volverAlCliente("")).toBe(false);
    expect(volverAlCliente(null)).toBe(false);
    expect(volverAlCliente("https://ejemplo.com")).toBe(false);
  });
});
