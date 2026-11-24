import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const crearSupabaseServidor = vi.fn();

vi.mock("./server", () => ({
  crearSupabaseServidor: () => crearSupabaseServidor(),
}));

vi.mock("next/navigation", () => ({
  redirect: (ruta: string) => {
    throw new Error(`REDIRECT ${ruta}`);
  },
  unstable_rethrow: () => undefined,
}));

const { obtenerUsuario, requerirUsuario } = await import("./usuario");

const usuarioDePrueba = { id: "u1", email: "ana@empresa.es" };

beforeEach(() => {
  getUser.mockReset();
  crearSupabaseServidor.mockReset();
  crearSupabaseServidor.mockResolvedValue({ auth: { getUser } });
});

describe("obtenerUsuario", () => {
  it("devuelve el usuario de la sesión", async () => {
    getUser.mockResolvedValue({ data: { user: usuarioDePrueba }, error: null });
    await expect(obtenerUsuario()).resolves.toEqual(usuarioDePrueba);
  });

  it("devuelve null si no hay sesión", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });
    await expect(obtenerUsuario()).resolves.toBeNull();
  });

  it("devuelve null si Supabase no está configurado", async () => {
    crearSupabaseServidor.mockRejectedValue(new Error("Faltan variables"));
    await expect(obtenerUsuario()).resolves.toBeNull();
  });
});

describe("requerirUsuario", () => {
  it("devuelve el usuario si hay sesión", async () => {
    getUser.mockResolvedValue({ data: { user: usuarioDePrueba }, error: null });
    await expect(requerirUsuario()).resolves.toEqual(usuarioDePrueba);
  });

  it("redirige a /login si no hay sesión", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requerirUsuario()).rejects.toThrow("REDIRECT /login");
  });
});
