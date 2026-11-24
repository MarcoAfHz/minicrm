import { describe, expect, it } from "vitest";
import {
  LIMITES_CLIENTE,
  esIdCliente,
  esquemaCliente,
  leerFormularioCliente,
  validarCliente,
} from "./cliente";

const clienteCompleto = {
  nombre: "Ana García",
  empresa: "Acme, S.L.",
  email: "ana@acme.es",
  telefono: "+34 600 123 456",
  notas: "Prefiere que la llamen por la mañana.",
};

function errores(entrada: Record<string, unknown>) {
  const resultado = validarCliente({ ...clienteCompleto, ...entrada });
  return resultado.ok ? {} : resultado.errores;
}

describe("esquemaCliente", () => {
  it("acepta un cliente con todos los campos", () => {
    expect(esquemaCliente.parse(clienteCompleto)).toEqual(clienteCompleto);
  });

  it("solo exige el nombre: el resto vacío se guarda como null", () => {
    expect(
      esquemaCliente.parse({
        nombre: "Luis",
        empresa: "",
        email: "   ",
        telefono: "",
        notas: "",
      }),
    ).toEqual({
      nombre: "Luis",
      empresa: null,
      email: null,
      telefono: null,
      notas: null,
    });
  });

  it("trata los campos que no llegan como vacíos", () => {
    expect(esquemaCliente.parse({ nombre: "Luis", email: null })).toEqual({
      nombre: "Luis",
      empresa: null,
      email: null,
      telefono: null,
      notas: null,
    });
  });

  it("quita los espacios de alrededor de cada campo", () => {
    const datos = esquemaCliente.parse({
      nombre: "  Ana  ",
      empresa: " Acme ",
      email: " ana@acme.es ",
      telefono: " 600 ",
      notas: " nota ",
    });
    expect(datos).toEqual({
      nombre: "Ana",
      empresa: "Acme",
      email: "ana@acme.es",
      telefono: "600",
      notas: "nota",
    });
  });
});

describe("validarCliente", () => {
  it("devuelve los datos limpios si todo es correcto", () => {
    expect(validarCliente(clienteCompleto)).toEqual({
      ok: true,
      datos: clienteCompleto,
    });
  });

  it("pide el nombre si está vacío o solo tiene espacios", () => {
    expect(errores({ nombre: "" }).nombre).toBe(
      "Escribe el nombre del cliente.",
    );
    expect(errores({ nombre: "    " }).nombre).toBe(
      "Escribe el nombre del cliente.",
    );
    expect(errores({ nombre: null }).nombre).toBe(
      "Escribe el nombre del cliente.",
    );
  });

  it("exige entre 2 y 100 caracteres en el nombre, sin contar espacios de alrededor", () => {
    expect(errores({ nombre: " A " }).nombre).toBe(
      "El nombre tiene que tener al menos 2 caracteres.",
    );
    expect(errores({ nombre: "Al" }).nombre).toBeUndefined();
    expect(
      errores({ nombre: "a".repeat(LIMITES_CLIENTE.nombre.max) }).nombre,
    ).toBeUndefined();
    expect(
      errores({ nombre: "a".repeat(LIMITES_CLIENTE.nombre.max + 1) }).nombre,
    ).toBe("El nombre no puede tener más de 100 caracteres.");
  });

  it("rechaza un email mal escrito", () => {
    expect(errores({ email: "ana@" }).email).toBe("Introduce un email válido.");
    expect(errores({ email: "ana acme.es" }).email).toBe(
      "Introduce un email válido.",
    );
  });

  it("rechaza un email demasiado largo", () => {
    const email = `${"a".repeat(250)}@acme.es`;
    expect(errores({ email }).email).toBe(
      "El email no puede tener más de 254 caracteres.",
    );
  });

  it("rechaza un teléfono con letras o demasiado largo", () => {
    expect(errores({ telefono: "600 abc" }).telefono).toBe(
      "El teléfono solo puede tener números, espacios y los signos + ( ) . -",
    );
    expect(errores({ telefono: "6".repeat(31) }).telefono).toBe(
      "El teléfono no puede tener más de 30 caracteres.",
    );
    expect(errores({ telefono: "(+34) 91.123-45-67" }).telefono).toBeUndefined();
  });

  it("limita la longitud de la empresa y de las notas", () => {
    expect(errores({ empresa: "e".repeat(101) }).empresa).toBe(
      "La empresa no puede tener más de 100 caracteres.",
    );
    expect(errores({ notas: "n".repeat(2001) }).notas).toBe(
      "Las notas no pueden tener más de 2000 caracteres.",
    );
    expect(errores({ notas: "n".repeat(2000) }).notas).toBeUndefined();
  });

  it("cuenta caracteres y no unidades UTF-16, igual que char_length", () => {
    expect(errores({ nombre: "😀" }).nombre).toBe(
      "El nombre tiene que tener al menos 2 caracteres.",
    );
    expect(errores({ nombre: "😀😀" }).nombre).toBeUndefined();
  });

  it("acepta hasta el límite de caracteres aunque sean emojis", () => {
    expect(errores({ nombre: "😀".repeat(100) }).nombre).toBeUndefined();
    expect(errores({ nombre: "😀".repeat(101) }).nombre).toBe(
      "El nombre no puede tener más de 100 caracteres.",
    );
    expect(errores({ empresa: "😀".repeat(100) }).empresa).toBeUndefined();
    expect(errores({ empresa: "😀".repeat(101) }).empresa).toBe(
      "La empresa no puede tener más de 100 caracteres.",
    );
    expect(errores({ notas: "😀".repeat(2000) }).notas).toBeUndefined();
    expect(errores({ notas: "😀".repeat(2001) }).notas).toBe(
      "Las notas no pueden tener más de 2000 caracteres.",
    );
  });

  it("cuenta cada acento combinado como un carácter, como PostgreSQL", () => {
    // "é" escrita como "e" + acento combinado (U+0301) son 2 code points.
    const eConAcento = "é";
    expect(errores({ nombre: eConAcento }).nombre).toBeUndefined();
    expect(errores({ nombre: eConAcento.repeat(50) }).nombre).toBeUndefined();
    expect(errores({ nombre: `${eConAcento.repeat(50)}a` }).nombre).toBe(
      "El nombre no puede tener más de 100 caracteres.",
    );
  });

  it("mide en caracteres el email y el teléfono", () => {
    expect(errores({ email: `${"a".repeat(247)}@acme.es` }).email).toBe(
      "El email no puede tener más de 254 caracteres.",
    );
    expect(errores({ telefono: "6".repeat(30) }).telefono).toBeUndefined();
  });

  it("devuelve un error por cada campo incorrecto", () => {
    expect(
      errores({ nombre: "", email: "mal", telefono: "x" }),
    ).toEqual({
      nombre: "Escribe el nombre del cliente.",
      email: "Introduce un email válido.",
      telefono:
        "El teléfono solo puede tener números, espacios y los signos + ( ) . -",
    });
  });

  it("no acepta una entrada que no sea un objeto", () => {
    expect(validarCliente(null).ok).toBe(false);
  });
});

describe("esIdCliente", () => {
  it("acepta un uuid", () => {
    expect(esIdCliente("3f2b8c1e-9d4a-4c6b-8e2f-1a2b3c4d5e6f")).toBe(true);
  });

  it("rechaza lo que no es un uuid", () => {
    expect(esIdCliente("123")).toBe(false);
    expect(esIdCliente("")).toBe(false);
    expect(esIdCliente("3f2b8c1e-9d4a-4c6b-8e2f-1a2b3c4d5e6g")).toBe(false);
    expect(esIdCliente(null)).toBe(false);
  });
});

describe("leerFormularioCliente", () => {
  it("lee cada campo del formulario", () => {
    const formData = new FormData();
    formData.set("nombre", "Ana");
    formData.set("empresa", "Acme");
    formData.set("email", "ana@acme.es");
    formData.set("telefono", "600");
    formData.set("notas", "nota");
    formData.set("otro", "se ignora");

    expect(leerFormularioCliente(formData)).toEqual({
      nombre: "Ana",
      empresa: "Acme",
      email: "ana@acme.es",
      telefono: "600",
      notas: "nota",
    });
  });

  it("deja vacíos los campos que faltan o que no son texto", () => {
    const formData = new FormData();
    formData.set("nombre", new Blob(["x"]));

    expect(leerFormularioCliente(formData)).toEqual({
      nombre: "",
      empresa: "",
      email: "",
      telefono: "",
      notas: "",
    });
  });
});
