import { beforeEach, describe, expect, it, vi } from "vitest";

type RespuestaBd = { data: unknown; error: { message: string } | null };

const from = vi.fn();
const llamadas: string[] = [];
let respuestaBd: RespuestaBd = { data: null, error: null };

/** Imita el constructor de consultas de Supabase: encadenable y awaitable. */
function consulta() {
  const builder = {
    select: () => anotar("select"),
    eq: (columna: string, valor: string) => anotar(`eq ${columna} ${valor}`),
    maybeSingle: () => anotar("maybeSingle"),
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
  crearSupabaseServidor: async () => ({ from }),
}));

const { obtenerCliente } = await import("./datos");

const ID = "3f2b8c1e-9d4a-4c6b-8e2f-1a2b3c4d5e6f";

beforeEach(() => {
  from.mockReset();
  from.mockImplementation(() => consulta());
  llamadas.length = 0;
  respuestaBd = { data: null, error: null };
});

describe("obtenerCliente", () => {
  it("busca el cliente por id y por dueño", async () => {
    const cliente = { id: ID, owner_id: "u1", nombre: "Ana" };
    respuestaBd = { data: cliente, error: null };

    await expect(obtenerCliente(ID, "u1")).resolves.toEqual(cliente);
    expect(llamadas).toEqual([
      "select",
      `eq id ${ID}`,
      "eq owner_id u1",
      "maybeSingle",
    ]);
  });

  it("devuelve null si el cliente no existe o es de otro usuario", async () => {
    respuestaBd = { data: null, error: null };

    await expect(obtenerCliente(ID, "u1")).resolves.toBeNull();
  });

  it("devuelve null sin consultar si el id no es un uuid", async () => {
    await expect(obtenerCliente("no-es-un-uuid", "u1")).resolves.toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("lanza un error genérico si falla la base de datos", async () => {
    respuestaBd = { data: null, error: { message: "permission denied" } };

    await expect(obtenerCliente(ID, "u1")).rejects.toThrow(
      "No se han podido cargar los clientes.",
    );
  });
});
