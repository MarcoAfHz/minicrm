import { afterEach, describe, expect, it, vi } from "vitest";
import { leerConfigSupabase } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("leerConfigSupabase", () => {
  it("devuelve la URL y la clave si están las dos variables", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ejemplo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "clave-de-prueba");

    expect(leerConfigSupabase()).toEqual({
      url: "https://ejemplo.supabase.co",
      clave: "clave-de-prueba",
    });
  });

  it("devuelve null si falta la URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "clave-de-prueba");

    expect(leerConfigSupabase()).toBeNull();
  });

  it("devuelve null si falta la clave", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ejemplo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

    expect(leerConfigSupabase()).toBeNull();
  });
});
