import { describe, expect, it } from "vitest";
import { esRutaActiva } from "./navegacion";

describe("esRutaActiva", () => {
  it("está activo en la misma página", () => {
    expect(esRutaActiva("/clientes", "/clientes")).toBe(true);
  });

  it("está activo en una subpágina", () => {
    expect(esRutaActiva("/clientes/123/editar", "/clientes")).toBe(true);
    expect(esRutaActiva("/oportunidades/nueva", "/oportunidades")).toBe(true);
  });

  it("ignora la barra final", () => {
    expect(esRutaActiva("/panel/", "/panel")).toBe(true);
  });

  it("no está activo en otra sección", () => {
    expect(esRutaActiva("/panel", "/clientes")).toBe(false);
  });

  it("no confunde rutas que solo empiezan igual", () => {
    expect(esRutaActiva("/clientes-antiguos", "/clientes")).toBe(false);
  });

  it("no está activo sin ruta o en la portada", () => {
    expect(esRutaActiva(null, "/panel")).toBe(false);
    expect(esRutaActiva("", "/panel")).toBe(false);
    expect(esRutaActiva("/", "/panel")).toBe(false);
  });
});
