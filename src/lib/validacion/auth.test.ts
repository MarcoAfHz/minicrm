import { describe, expect, it } from "vitest";
import { esquemaLogin } from "./auth";

function primerError(entrada: unknown): string | undefined {
  const resultado = esquemaLogin.safeParse(entrada);
  return resultado.success ? undefined : resultado.error.issues[0]?.message;
}

describe("esquemaLogin", () => {
  it("acepta un email y una contraseña válidos", () => {
    const resultado = esquemaLogin.safeParse({
      email: "ana@empresa.es",
      password: "secreta123",
    });
    expect(resultado.success).toBe(true);
  });

  it("quita los espacios de alrededor del email", () => {
    const resultado = esquemaLogin.parse({
      email: "  ana@empresa.es ",
      password: "secreta123",
    });
    expect(resultado.email).toBe("ana@empresa.es");
  });

  it("no recorta la contraseña", () => {
    const resultado = esquemaLogin.parse({
      email: "ana@empresa.es",
      password: " con espacios ",
    });
    expect(resultado.password).toBe(" con espacios ");
  });

  it("pide el email si está vacío o solo tiene espacios", () => {
    expect(primerError({ email: "", password: "x" })).toBe(
      "Introduce tu email.",
    );
    expect(primerError({ email: "   ", password: "x" })).toBe(
      "Introduce tu email.",
    );
  });

  it("pide el email si no llega en el formulario", () => {
    expect(primerError({ email: null, password: "x" })).toBe(
      "Introduce tu email.",
    );
  });

  it("rechaza un email mal escrito", () => {
    expect(primerError({ email: "ana@", password: "x" })).toBe(
      "Introduce un email válido.",
    );
    expect(primerError({ email: "ana empresa.es", password: "x" })).toBe(
      "Introduce un email válido.",
    );
  });

  it("pide la contraseña si está vacía o no llega", () => {
    expect(primerError({ email: "ana@empresa.es", password: "" })).toBe(
      "Introduce tu contraseña.",
    );
    expect(primerError({ email: "ana@empresa.es", password: null })).toBe(
      "Introduce tu contraseña.",
    );
  });
});
