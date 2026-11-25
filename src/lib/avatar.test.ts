import { describe, expect, it } from "vitest";
import {
  COLORES_AVATAR,
  SIN_INICIALES,
  colorAvatar,
  iniciales,
  inicialesDeEmail,
} from "./avatar";

describe("iniciales", () => {
  it("usa la primera letra del nombre y del apellido", () => {
    expect(iniciales("Ana García")).toBe("AG");
  });

  it("con más de dos palabras usa la primera y la última", () => {
    expect(iniciales("Ana María López Pérez")).toBe("AP");
  });

  it("con una sola palabra devuelve una letra", () => {
    expect(iniciales("Acme")).toBe("A");
  });

  it("pasa a mayúsculas y respeta las tildes y la ñ", () => {
    expect(iniciales("óscar ñúñez")).toBe("ÓÑ");
  });

  it("ignora espacios de más y signos", () => {
    expect(iniciales("  (Acme)   «Soluciones»  ")).toBe("AS");
  });

  it("acepta cifras", () => {
    expect(iniciales("3M España")).toBe("3E");
  });

  it("devuelve «?» si el nombre está vacío", () => {
    expect(iniciales("")).toBe(SIN_INICIALES);
    expect(iniciales("   ")).toBe(SIN_INICIALES);
  });

  it("devuelve «?» si no hay ninguna letra", () => {
    expect(iniciales("- · -")).toBe(SIN_INICIALES);
  });
});

describe("inicialesDeEmail", () => {
  it("separa por puntos, guiones y guiones bajos", () => {
    expect(inicialesDeEmail("ana.lopez@empresa.es")).toBe("AL");
    expect(inicialesDeEmail("ana_maria-lopez@empresa.es")).toBe("AL");
  });

  it("con una sola palabra devuelve una letra", () => {
    expect(inicialesDeEmail("demo@minicrm.app")).toBe("D");
  });

  it("sin email devuelve «?»", () => {
    expect(inicialesDeEmail("")).toBe(SIN_INICIALES);
    expect(inicialesDeEmail("@minicrm.app")).toBe(SIN_INICIALES);
  });
});

describe("colorAvatar", () => {
  it("devuelve siempre el mismo color para el mismo nombre", () => {
    expect(colorAvatar("Ana García")).toBe(colorAvatar("Ana García"));
  });

  it("no distingue mayúsculas ni espacios de más", () => {
    expect(colorAvatar("  ana   GARCÍA ")).toBe(colorAvatar("Ana García"));
  });

  it("devuelve un color de la paleta", () => {
    for (const nombre of ["Ana", "Luis Pérez", "Acme S.L.", "ñ", "3M"]) {
      expect(COLORES_AVATAR).toContain(colorAvatar(nombre));
    }
  });

  it("reparte nombres distintos entre varios colores", () => {
    const nombres = [
      "Ana García",
      "Luis Pérez",
      "Marta Ruiz",
      "Jorge Sanz",
      "Lucía Gómez",
      "Pablo Díaz",
      "Elena Martín",
      "Carlos Romero",
    ];
    const colores = new Set(nombres.map(colorAvatar));
    expect(colores.size).toBeGreaterThan(1);
  });

  it("con un nombre vacío devuelve un color válido", () => {
    expect(COLORES_AVATAR).toContain(colorAvatar(""));
  });
});
