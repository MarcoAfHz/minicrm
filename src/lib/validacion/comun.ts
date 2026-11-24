import { z } from "zod";

/** Acepta un texto, null o nada; quita los espacios de alrededor. */
export const textoRecortado = z
  .string()
  .nullish()
  .transform((valor) => (valor ?? "").trim());

/** Un texto vacío se guarda como null. */
export function vacioANull(valor: string): string | null {
  return valor === "" ? null : valor;
}

/**
 * Longitud en caracteres (code points), como `char_length` de PostgreSQL.
 * `.length` cuenta unidades UTF-16: un emoji contaría 2 y el formulario y los
 * `check` de las migraciones no medirían igual.
 */
export function caracteres(valor: string): number {
  return [...valor].length;
}

/** Lee un campo de un FormData. Lo que no sea texto, o falte, cuenta como vacío. */
export function leerTexto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor : "";
}
