import { describe, expect, it } from "vitest";
import {
  LONGITUD_MAXIMA_BUSQUEDA,
  escaparLike,
  filtroBusquedaClientes,
  normalizarBusqueda,
  patronContiene,
} from "./busqueda";

describe("normalizarBusqueda", () => {
  it("quita los espacios de alrededor", () => {
    expect(normalizarBusqueda("  Acme  ")).toBe("Acme");
  });

  it("devuelve un texto vacío si no hay búsqueda", () => {
    expect(normalizarBusqueda(undefined)).toBe("");
    expect(normalizarBusqueda("   ")).toBe("");
    expect(normalizarBusqueda([])).toBe("");
  });

  it("usa el primer valor si el parámetro llega repetido", () => {
    expect(normalizarBusqueda(["ana", "luis"])).toBe("ana");
  });

  it("corta los textos demasiado largos", () => {
    const largo = "a".repeat(LONGITUD_MAXIMA_BUSQUEDA + 50);
    expect(normalizarBusqueda(largo)).toHaveLength(LONGITUD_MAXIMA_BUSQUEDA);
  });
});

describe("escaparLike", () => {
  it("deja igual un texto sin caracteres especiales", () => {
    expect(escaparLike("Ana García")).toBe("Ana García");
  });

  it("escapa % y _", () => {
    expect(escaparLike("50%_off")).toBe("50\\%\\_off");
  });

  it("escapa la barra invertida", () => {
    expect(escaparLike("a\\b")).toBe("a\\\\b");
  });

  it("devuelve un texto vacío si no hay texto", () => {
    expect(escaparLike("")).toBe("");
  });
});

describe("patronContiene", () => {
  it("rodea el texto escapado con %", () => {
    expect(patronContiene("ana_1")).toBe("%ana\\_1%");
  });

  it("cambia * por _ para que PostgREST no lo use como comodín", () => {
    expect(patronContiene("a*b")).toBe("%a_b%");
  });

  it("con un texto vacío encuentra cualquier valor", () => {
    expect(patronContiene("")).toBe("%%");
  });
});

describe("filtroBusquedaClientes", () => {
  it("busca en el nombre o en la empresa", () => {
    expect(filtroBusquedaClientes("acme")).toBe(
      'nombre.ilike."%acme%",empresa.ilike."%acme%"',
    );
  });

  it("mete entre comillas las comas, puntos y paréntesis", () => {
    expect(filtroBusquedaClientes("Acme, S.L. (Madrid)")).toBe(
      'nombre.ilike."%Acme, S.L. (Madrid)%",empresa.ilike."%Acme, S.L. (Madrid)%"',
    );
  });

  it("escapa las comillas dobles y las barras invertidas", () => {
    expect(filtroBusquedaClientes('a"b\\%')).toBe(
      'nombre.ilike."%a\\"b\\\\\\\\\\\\%%",empresa.ilike."%a\\"b\\\\\\\\\\\\%%"',
    );
  });
});
