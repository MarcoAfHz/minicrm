import { describe, expect, it } from "vitest";
import { caracteres, leerTexto, textoRecortado, vacioANull } from "./comun";

describe("textoRecortado", () => {
  it("quita los espacios de alrededor", () => {
    expect(textoRecortado.parse("  Ana  ")).toBe("Ana");
  });

  it("trata null y undefined como texto vacío", () => {
    expect(textoRecortado.parse(null)).toBe("");
    expect(textoRecortado.parse(undefined)).toBe("");
  });

  it("rechaza lo que no es texto", () => {
    expect(textoRecortado.safeParse(12).success).toBe(false);
  });
});

describe("vacioANull", () => {
  it("convierte el texto vacío en null", () => {
    expect(vacioANull("")).toBeNull();
  });

  it("deja igual cualquier otro texto", () => {
    expect(vacioANull("Acme")).toBe("Acme");
    expect(vacioANull(" ")).toBe(" ");
  });
});

describe("caracteres", () => {
  it("cuenta caracteres normales", () => {
    expect(caracteres("Ana")).toBe(3);
    expect(caracteres("")).toBe(0);
  });

  it("cuenta un emoji como un carácter, igual que char_length", () => {
    expect("😀".length).toBe(2);
    expect(caracteres("😀")).toBe(1);
  });
});

describe("leerTexto", () => {
  it("lee el texto de un campo", () => {
    const formData = new FormData();
    formData.set("nombre", "Ana");
    expect(leerTexto(formData, "nombre")).toBe("Ana");
  });

  it("devuelve vacío si el campo falta o no es texto", () => {
    const formData = new FormData();
    formData.set("archivo", new Blob(["x"]));
    expect(leerTexto(formData, "archivo")).toBe("");
    expect(leerTexto(formData, "nombre")).toBe("");
  });
});
