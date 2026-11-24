import { beforeEach, describe, expect, it, vi } from "vitest";

type RespuestaBd = { data: unknown; error: { message: string } | null };

const from = vi.fn();
const llamadas: string[] = [];
let respuestaBd: RespuestaBd = { data: null, error: null };

/** Imita el constructor de consultas de Supabase: encadenable y awaitable. */
function consulta(tabla: string) {
  const builder = {
    select: (columnas: string) => anotar(`select ${columnas}`),
    eq: (columna: string, valor: string) => anotar(`eq ${columna} ${valor}`),
    order: (columna: string) => anotar(`order ${columna}`),
    maybeSingle: () => anotar("maybeSingle"),
    then: (resolver: (valor: RespuestaBd) => unknown) =>
      Promise.resolve(respuestaBd).then(resolver),
  };
  function anotar(llamada: string) {
    llamadas.push(`${tabla}: ${llamada}`);
    return builder;
  }
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  crearSupabaseServidor: async () => ({ from }),
}));

const { listarOportunidades, listarOportunidadesDeCliente, obtenerOportunidad } =
  await import("./datos");

const ID = "3f2b8c1e-9d4a-4c6b-8e2f-1a2b3c4d5e6f";
const ID_CLIENTE = "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

beforeEach(() => {
  from.mockReset();
  from.mockImplementation((tabla: string) => consulta(tabla));
  llamadas.length = 0;
  respuestaBd = { data: null, error: null };
});

describe("listarOportunidades", () => {
  it("lee solo las oportunidades del usuario, con su cliente", async () => {
    respuestaBd = { data: [], error: null };

    await expect(listarOportunidades("u1")).resolves.toEqual([]);
    expect(llamadas).toContain("oportunidades: eq owner_id u1");
    expect(llamadas[0]).toContain("cliente:clientes(id, nombre)");
  });

  it("lanza un error genérico si falla la base de datos", async () => {
    respuestaBd = { data: null, error: { message: "permission denied" } };

    await expect(listarOportunidades("u1")).rejects.toThrow(
      "No se han podido cargar las oportunidades.",
    );
  });
});

describe("listarOportunidadesDeCliente", () => {
  it("filtra por cliente y por dueño", async () => {
    respuestaBd = { data: [{ id: ID }], error: null };

    await expect(listarOportunidadesDeCliente(ID_CLIENTE, "u1")).resolves.toEqual(
      [{ id: ID }],
    );
    expect(llamadas).toContain(`oportunidades: eq cliente_id ${ID_CLIENTE}`);
    expect(llamadas).toContain("oportunidades: eq owner_id u1");
  });

  it("devuelve una lista vacía sin consultar si el id no es un uuid", async () => {
    await expect(listarOportunidadesDeCliente("x", "u1")).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });
});

describe("obtenerOportunidad", () => {
  it("busca la oportunidad por id y por dueño", async () => {
    const oportunidad = { id: ID, owner_id: "u1", titulo: "Web" };
    respuestaBd = { data: oportunidad, error: null };

    await expect(obtenerOportunidad(ID, "u1")).resolves.toEqual(oportunidad);
    expect(llamadas.slice(1)).toEqual([
      `oportunidades: eq id ${ID}`,
      "oportunidades: eq owner_id u1",
      "oportunidades: maybeSingle",
    ]);
  });

  it("devuelve null si no existe o es de otro usuario", async () => {
    await expect(obtenerOportunidad(ID, "u1")).resolves.toBeNull();
  });

  it("devuelve null sin consultar si el id no es un uuid", async () => {
    await expect(obtenerOportunidad("no-es-un-uuid", "u1")).resolves.toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("lanza un error genérico si falla la base de datos", async () => {
    respuestaBd = { data: null, error: { message: "permission denied" } };

    await expect(obtenerOportunidad(ID, "u1")).rejects.toThrow(
      "No se han podido cargar las oportunidades.",
    );
  });
});
