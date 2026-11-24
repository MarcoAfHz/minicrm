import { beforeEach, describe, expect, it, vi } from "vitest";

type RespuestaBd = { data: unknown; error: { message: string } | null };

const getUser = vi.fn();
const from = vi.fn();
const llamadas: string[] = [];
let respuestaBd: RespuestaBd = { data: null, error: null };

/** Imita el constructor de consultas de Supabase: encadenable y awaitable. */
function consulta() {
  const builder = {
    insert: (datos: unknown) => anotar(`insert ${JSON.stringify(datos)}`),
    update: (datos: unknown) => anotar(`update ${JSON.stringify(datos)}`),
    delete: () => anotar("delete"),
    select: (columnas: string) => anotar(`select ${columnas}`),
    eq: (columna: string, valor: string) => anotar(`eq ${columna} ${valor}`),
    single: () => anotar("single"),
    then: (resolver: (valor: RespuestaBd) => unknown) =>
      Promise.resolve(respuestaBd).then(resolver),
  };
  function anotar(llamada: string) {
    llamadas.push(llamada);
    return builder;
  }
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  crearSupabaseServidor: async () => ({ auth: { getUser }, from }),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

class Redireccion extends Error {}
vi.mock("next/navigation", () => ({
  redirect: (ruta: string) => {
    throw new Redireccion(ruta);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Redireccion) {
      throw error;
    }
  },
}));

const { actualizarCliente, borrarCliente, crearCliente } = await import(
  "./actions"
);

const ID = "3f2b8c1e-9d4a-4c6b-8e2f-1a2b3c4d5e6f";

function formulario(campos: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [nombre, valor] of Object.entries(campos)) {
    formData.set(nombre, valor);
  }
  return formData;
}

function esperarRevalidacion() {
  expect(revalidatePath).toHaveBeenCalledWith("/clientes", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/oportunidades", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/panel");
}

beforeEach(() => {
  getUser.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  from.mockReset();
  from.mockImplementation(() => consulta());
  revalidatePath.mockReset();
  llamadas.length = 0;
  respuestaBd = { data: null, error: null };
});

describe("crearCliente", () => {
  it("sin sesión devuelve un error y no toca la base de datos", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const resultado = await crearCliente(null, formulario({ nombre: "Ana" }));

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("con datos no válidos devuelve los errores por campo y lo escrito", async () => {
    const resultado = await crearCliente(
      null,
      formulario({ nombre: "A", email: "mal" }),
    );

    expect(resultado).toEqual({
      ok: false,
      error: "Revisa los campos marcados.",
      errores: {
        nombre: "El nombre tiene que tener al menos 2 caracteres.",
        email: "Introduce un email válido.",
      },
      valores: { nombre: "A", empresa: "", email: "mal", telefono: "", notas: "" },
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("guarda los datos limpios y lleva a la ficha", async () => {
    respuestaBd = { data: { id: ID }, error: null };

    await expect(
      crearCliente(null, formulario({ nombre: " Ana ", empresa: "" })),
    ).rejects.toThrow(`/clientes/${ID}`);

    expect(llamadas[0]).toBe(
      'insert {"nombre":"Ana","empresa":null,"email":null,"telefono":null,"notas":null}',
    );
    esperarRevalidacion();
  });

  it("no enseña el error interno de la base de datos", async () => {
    respuestaBd = { data: null, error: { message: "violates check constraint" } };

    const resultado = await crearCliente(null, formulario({ nombre: "Ana" }));

    expect(resultado).toMatchObject({
      ok: false,
      error: "No se ha podido guardar el cliente. Inténtalo de nuevo.",
    });
    expect(JSON.stringify(resultado)).not.toContain("constraint");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("actualizarCliente", () => {
  it("sin sesión devuelve un error y no toca la base de datos", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const resultado = await actualizarCliente(
      null,
      formulario({ id: ID, nombre: "Ana" }),
    );

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza un id que no es un uuid", async () => {
    const resultado = await actualizarCliente(
      null,
      formulario({ id: "1 or 1=1", nombre: "Ana" }),
    );

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("avisa si el cliente no existe o es de otro usuario", async () => {
    respuestaBd = { data: [], error: null };

    const resultado = await actualizarCliente(
      null,
      formulario({ id: ID, nombre: "Ana" }),
    );

    expect(resultado).toMatchObject({
      ok: false,
      error: "No se ha encontrado el cliente. Puede que ya se haya borrado.",
    });
  });

  it("guarda los cambios del cliente indicado, solo si es del usuario, y vuelve a la ficha", async () => {
    respuestaBd = { data: [{ id: ID }], error: null };

    await expect(
      actualizarCliente(null, formulario({ id: ID, nombre: "Ana" })),
    ).rejects.toThrow(`/clientes/${ID}`);

    expect(llamadas).toEqual([
      'update {"nombre":"Ana","empresa":null,"email":null,"telefono":null,"notas":null}',
      `eq id ${ID}`,
      "eq owner_id u1",
      "select id",
    ]);
    esperarRevalidacion();
  });
});

describe("borrarCliente", () => {
  it("sin sesión devuelve un error y no toca la base de datos", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const resultado = await borrarCliente(null, formulario({ id: ID }));

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza un id que no es un uuid", async () => {
    const resultado = await borrarCliente(null, formulario({ id: "abc" }));

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("borra el cliente, solo si es del usuario, y vuelve al listado", async () => {
    respuestaBd = { data: [{ id: ID }], error: null };

    await expect(borrarCliente(null, formulario({ id: ID }))).rejects.toThrow(
      "/clientes",
    );

    expect(llamadas).toEqual([
      "delete",
      `eq id ${ID}`,
      "eq owner_id u1",
      "select id",
    ]);
    esperarRevalidacion();
  });

  it("no enseña el error interno de la base de datos", async () => {
    respuestaBd = { data: null, error: { message: "permission denied" } };

    const resultado = await borrarCliente(null, formulario({ id: ID }));

    expect(resultado).toEqual({
      ok: false,
      error: "No se ha podido borrar el cliente. Inténtalo de nuevo.",
    });
  });
});
