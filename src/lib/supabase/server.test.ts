import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orden: string[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => {
    orden.push("cookies");
    return { getAll: () => [], set: () => undefined };
  },
}));

vi.mock("next/server", () => ({
  connection: async () => {
    orden.push("connection");
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (url: string, clave: string) => {
    orden.push("createServerClient");
    return { url, clave };
  },
}));

const { crearSupabaseServidor } = await import("./server");

beforeEach(() => {
  orden.length = 0;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("crearSupabaseServidor", () => {
  it("espera a la petición real (connection) antes de crear el cliente", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ejemplo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "clave-de-prueba");

    await expect(crearSupabaseServidor()).resolves.toEqual({
      url: "https://ejemplo.supabase.co",
      clave: "clave-de-prueba",
    });
    expect(orden).toEqual(["cookies", "connection", "createServerClient"]);
  });

  it("lanza el error de configuración si faltan las variables, sin crear el cliente", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(crearSupabaseServidor()).rejects.toThrow(
      "Faltan las variables de entorno",
    );
    expect(orden).toEqual(["cookies", "connection"]);
  });
});
