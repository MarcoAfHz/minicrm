import { beforeEach, describe, expect, it, vi } from "vitest";

type RespuestaBd = { data: unknown; error: { message: string } | null };

const getUser = vi.fn();
const from = vi.fn();
const llamadas: string[] = [];
/** Lo que devuelve la base de datos para cada tabla. */
let respuestas: Record<string, RespuestaBd> = {};

/** Imita el constructor de consultas de Supabase: encadenable y awaitable. */
function consulta(tabla: string) {
  const builder = {
    insert: (datos: unknown) => anotar(`insert ${JSON.stringify(datos)}`),
    update: (datos: unknown) => anotar(`update ${JSON.stringify(datos)}`),
    delete: () => anotar("delete"),
    select: (columnas: string) => anotar(`select ${columnas}`),
    eq: (columna: string, valor: string) => anotar(`eq ${columna} ${valor}`),
    maybeSingle: () => anotar("maybeSingle"),
    then: (resolver: (valor: RespuestaBd) => unknown) =>
      Promise.resolve(respuestas[tabla] ?? { data: null, error: null }).then(
        resolver,
      ),
  };
  function anotar(llamada: string) {
    llamadas.push(`${tabla}: ${llamada}`);
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

const {
  actualizarOportunidad,
  borrarOportunidad,
  cambiarEtapa,
  crearOportunidad,
} = await import("./actions");

const ID = "3f2b8c1e-9d4a-4c6b-8e2f-1a2b3c4d5e6f";
const ID_CLIENTE = "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

const camposValidos = {
  cliente_id: ID_CLIENTE,
  titulo: " Web nueva ",
  importe: "1.234,56",
  etapa: "propuesta",
  fecha_cierre_prevista: "2026-12-31",
};

const datosLimpios =
  `{"cliente_id":"${ID_CLIENTE}","titulo":"Web nueva","importe":1234.56,` +
  `"etapa":"propuesta","fecha_cierre_prevista":"2026-12-31"}`;

const comprobacionCliente = [
  "clientes: select id",
  `clientes: eq id ${ID_CLIENTE}`,
  "clientes: eq owner_id u1",
  "clientes: maybeSingle",
];

function formulario(campos: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [nombre, valor] of Object.entries(campos)) {
    formData.set(nombre, valor);
  }
  return formData;
}

function esperarRevalidacion() {
  expect(revalidatePath).toHaveBeenCalledWith("/oportunidades", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/clientes", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/panel");
}

beforeEach(() => {
  getUser.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  from.mockReset();
  from.mockImplementation((tabla: string) => consulta(tabla));
  revalidatePath.mockReset();
  llamadas.length = 0;
  respuestas = {
    clientes: { data: { id: ID_CLIENTE }, error: null },
  };
});

describe("crearOportunidad", () => {
  it("sin sesión devuelve un error y no toca la base de datos", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const resultado = await crearOportunidad(null, formulario(camposValidos));

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("con datos no válidos devuelve los errores por campo y lo escrito", async () => {
    const resultado = await crearOportunidad(
      null,
      formulario({ ...camposValidos, titulo: "A", importe: "-5" }),
    );

    expect(resultado).toEqual({
      ok: false,
      error: "Revisa los campos marcados.",
      errores: {
        titulo: "El título tiene que tener al menos 2 caracteres.",
        importe: "El importe no puede ser negativo.",
      },
      valores: { ...camposValidos, titulo: "A", importe: "-5" },
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("no deja usar un cliente de otro usuario", async () => {
    respuestas.clientes = { data: null, error: null };

    const resultado = await crearOportunidad(null, formulario(camposValidos));

    expect(resultado).toMatchObject({
      ok: false,
      errores: {
        cliente_id:
          "Ese cliente no existe o se ha borrado. Elige otro de la lista.",
      },
    });
    expect(llamadas).toEqual(comprobacionCliente);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("comprueba el cliente, guarda los datos limpios y vuelve al tablero", async () => {
    await expect(
      crearOportunidad(null, formulario(camposValidos)),
    ).rejects.toThrow("/oportunidades");

    expect(llamadas).toEqual([
      ...comprobacionCliente,
      `oportunidades: insert ${datosLimpios}`,
    ]);
    esperarRevalidacion();
  });

  it("vuelve a la ficha del cliente si se abrió desde allí", async () => {
    await expect(
      crearOportunidad(
        null,
        formulario({ ...camposValidos, volver: "cliente" }),
      ),
    ).rejects.toThrow(`/clientes/${ID_CLIENTE}`);
  });

  it("no enseña el error interno de la base de datos", async () => {
    respuestas.oportunidades = {
      data: null,
      error: { message: "violates row-level security policy" },
    };

    const resultado = await crearOportunidad(null, formulario(camposValidos));

    expect(resultado).toMatchObject({
      ok: false,
      error: "No se ha podido guardar la oportunidad. Inténtalo de nuevo.",
    });
    expect(JSON.stringify(resultado)).not.toContain("security");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("si falla la comprobación del cliente da un error genérico", async () => {
    respuestas.clientes = { data: null, error: { message: "timeout" } };

    const resultado = await crearOportunidad(null, formulario(camposValidos));

    expect(resultado).toMatchObject({
      ok: false,
      error: "No se ha podido guardar la oportunidad. Inténtalo de nuevo.",
    });
    expect(llamadas).toEqual(comprobacionCliente);
  });
});

describe("actualizarOportunidad", () => {
  it("sin sesión devuelve un error y no toca la base de datos", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const resultado = await actualizarOportunidad(
      null,
      formulario({ id: ID, ...camposValidos }),
    );

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza un id que no es un uuid", async () => {
    const resultado = await actualizarOportunidad(
      null,
      formulario({ id: "1 or 1=1", ...camposValidos }),
    );

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("no deja pasar la oportunidad a un cliente de otro usuario", async () => {
    respuestas.clientes = { data: null, error: null };

    const resultado = await actualizarOportunidad(
      null,
      formulario({ id: ID, ...camposValidos }),
    );

    expect(resultado).toMatchObject({
      ok: false,
      errores: {
        cliente_id:
          "Ese cliente no existe o se ha borrado. Elige otro de la lista.",
      },
    });
    expect(llamadas.some((l) => l.startsWith("oportunidades"))).toBe(false);
  });

  it("avisa si la oportunidad no existe o es de otro usuario", async () => {
    respuestas.oportunidades = { data: [], error: null };

    const resultado = await actualizarOportunidad(
      null,
      formulario({ id: ID, ...camposValidos }),
    );

    expect(resultado).toMatchObject({
      ok: false,
      error: "No se ha encontrado la oportunidad. Puede que ya se haya borrado.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("guarda los cambios solo si la oportunidad es del usuario y vuelve al tablero", async () => {
    respuestas.oportunidades = { data: [{ id: ID }], error: null };

    await expect(
      actualizarOportunidad(null, formulario({ id: ID, ...camposValidos })),
    ).rejects.toThrow("/oportunidades");

    expect(llamadas).toEqual([
      ...comprobacionCliente,
      `oportunidades: update ${datosLimpios}`,
      `oportunidades: eq id ${ID}`,
      "oportunidades: eq owner_id u1",
      "oportunidades: select id",
    ]);
    esperarRevalidacion();
  });

  it("no enseña el error interno de la base de datos", async () => {
    respuestas.oportunidades = {
      data: null,
      error: { message: "violates check constraint" },
    };

    const resultado = await actualizarOportunidad(
      null,
      formulario({ id: ID, ...camposValidos }),
    );

    expect(resultado).toMatchObject({
      ok: false,
      error: "No se han podido guardar los cambios. Inténtalo de nuevo.",
    });
    expect(JSON.stringify(resultado)).not.toContain("constraint");
  });
});

describe("borrarOportunidad", () => {
  it("sin sesión devuelve un error y no toca la base de datos", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const resultado = await borrarOportunidad(null, formulario({ id: ID }));

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza un id que no es un uuid", async () => {
    const resultado = await borrarOportunidad(null, formulario({ id: "abc" }));

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("avisa si la oportunidad no existe o es de otro usuario", async () => {
    respuestas.oportunidades = { data: [], error: null };

    const resultado = await borrarOportunidad(null, formulario({ id: ID }));

    expect(resultado).toEqual({
      ok: false,
      error: "No se ha encontrado la oportunidad. Puede que ya se haya borrado.",
    });
  });

  it("borra la oportunidad solo si es del usuario y vuelve al tablero", async () => {
    respuestas.oportunidades = {
      data: [{ id: ID, cliente_id: ID_CLIENTE }],
      error: null,
    };

    await expect(
      borrarOportunidad(null, formulario({ id: ID })),
    ).rejects.toThrow("/oportunidades");

    expect(llamadas).toEqual([
      "oportunidades: delete",
      `oportunidades: eq id ${ID}`,
      "oportunidades: eq owner_id u1",
      "oportunidades: select id, cliente_id",
    ]);
    esperarRevalidacion();
  });

  it("vuelve a la ficha del cliente si se abrió desde allí", async () => {
    respuestas.oportunidades = {
      data: [{ id: ID, cliente_id: ID_CLIENTE }],
      error: null,
    };

    await expect(
      borrarOportunidad(null, formulario({ id: ID, volver: "cliente" })),
    ).rejects.toThrow(`/clientes/${ID_CLIENTE}`);
  });

  it("no enseña el error interno de la base de datos", async () => {
    respuestas.oportunidades = {
      data: null,
      error: { message: "permission denied" },
    };

    const resultado = await borrarOportunidad(null, formulario({ id: ID }));

    expect(resultado).toEqual({
      ok: false,
      error: "No se ha podido borrar la oportunidad. Inténtalo de nuevo.",
    });
  });
});

describe("cambiarEtapa", () => {
  it("sin sesión devuelve un error y no toca la base de datos", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const resultado = await cambiarEtapa(
      null,
      formulario({ id: ID, etapa: "ganada" }),
    );

    expect(resultado).toEqual({
      ok: false,
      error: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza una etapa que no es del embudo", async () => {
    const resultado = await cambiarEtapa(
      null,
      formulario({ id: ID, etapa: "archivada" }),
    );

    expect(resultado).toEqual({ ok: false, error: "Elige una etapa válida." });
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza un id que no es un uuid", async () => {
    const resultado = await cambiarEtapa(
      null,
      formulario({ id: "abc", etapa: "ganada" }),
    );

    expect(resultado).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("cambia solo la etapa, solo si la oportunidad es del usuario", async () => {
    respuestas.oportunidades = { data: [{ id: ID }], error: null };

    const resultado = await cambiarEtapa(
      null,
      formulario({ id: ID, etapa: "ganada" }),
    );

    expect(resultado).toEqual({ ok: true });
    expect(llamadas).toEqual([
      'oportunidades: update {"etapa":"ganada"}',
      `oportunidades: eq id ${ID}`,
      "oportunidades: eq owner_id u1",
      "oportunidades: select id",
    ]);
    esperarRevalidacion();
  });

  it("avisa si la oportunidad no existe o es de otro usuario", async () => {
    respuestas.oportunidades = { data: [], error: null };

    const resultado = await cambiarEtapa(
      null,
      formulario({ id: ID, etapa: "ganada" }),
    );

    expect(resultado).toEqual({
      ok: false,
      error: "No se ha encontrado la oportunidad. Puede que ya se haya borrado.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("no enseña el error interno de la base de datos", async () => {
    respuestas.oportunidades = {
      data: null,
      error: { message: "permission denied for table oportunidades" },
    };

    const resultado = await cambiarEtapa(
      null,
      formulario({ id: ID, etapa: "ganada" }),
    );

    expect(resultado).toEqual({
      ok: false,
      error: "No se ha podido cambiar la etapa. Inténtalo de nuevo.",
    });
  });

  it("no deja escapar una excepción inesperada", async () => {
    getUser.mockRejectedValue(new Error("red caída"));

    const resultado = await cambiarEtapa(
      null,
      formulario({ id: ID, etapa: "ganada" }),
    );

    expect(resultado).toEqual({
      ok: false,
      error: "No se ha podido cambiar la etapa. Inténtalo de nuevo.",
    });
  });
});
