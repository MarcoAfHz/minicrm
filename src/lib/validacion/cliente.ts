import { z } from "zod";
import type { ResultadoFormulario } from "@/lib/resultado";
import type { DatosCliente } from "@/lib/tipos";
import { caracteres, leerTexto, textoRecortado, vacioANull } from "./comun";

export const CAMPOS_CLIENTE = [
  "nombre",
  "empresa",
  "email",
  "telefono",
  "notas",
] as const;

export type CampoCliente = (typeof CAMPOS_CLIENTE)[number];

/** Lo que se ha escrito en cada campo del formulario, tal cual. */
export type ValoresFormularioCliente = Record<CampoCliente, string>;

/** Un mensaje por campo con error. */
export type ErroresCliente = Partial<Record<CampoCliente, string>>;

/** Lo que devuelven las Server Actions de crear y editar un cliente. */
export type EstadoFormularioCliente = ResultadoFormulario<CampoCliente>;

/**
 * Límites de longitud en caracteres (code points): los mismos que los `check`
 * de la migración, que usan `char_length`.
 */
export const LIMITES_CLIENTE = {
  nombre: { min: 2, max: 100 },
  empresa: 100,
  email: 254,
  telefono: 30,
  notas: 2000,
} as const;

const PATRON_TELEFONO = /^[0-9+()\s.-]*$/;

function maxCaracteres(max: number, mensaje: string) {
  return z.string().refine((valor) => caracteres(valor) <= max, {
    error: mensaje,
  });
}

function textoOpcional(max: number, mensajeMax: string) {
  return textoRecortado
    .pipe(maxCaracteres(max, mensajeMax))
    .transform(vacioANull);
}

export const esquemaCliente = z.object({
  nombre: textoRecortado.pipe(
    z
      .string()
      .min(1, { error: "Escribe el nombre del cliente." })
      .refine((valor) => caracteres(valor) >= LIMITES_CLIENTE.nombre.min, {
        error: `El nombre tiene que tener al menos ${LIMITES_CLIENTE.nombre.min} caracteres.`,
      })
      .refine((valor) => caracteres(valor) <= LIMITES_CLIENTE.nombre.max, {
        error: `El nombre no puede tener más de ${LIMITES_CLIENTE.nombre.max} caracteres.`,
      }),
  ),
  empresa: textoOpcional(
    LIMITES_CLIENTE.empresa,
    `La empresa no puede tener más de ${LIMITES_CLIENTE.empresa} caracteres.`,
  ),
  email: textoRecortado
    .pipe(
      maxCaracteres(
        LIMITES_CLIENTE.email,
        `El email no puede tener más de ${LIMITES_CLIENTE.email} caracteres.`,
      ),
    )
    .refine((valor) => valor === "" || z.email().safeParse(valor).success, {
      error: "Introduce un email válido.",
    })
    .transform(vacioANull),
  telefono: textoRecortado
    .pipe(
      maxCaracteres(
        LIMITES_CLIENTE.telefono,
        `El teléfono no puede tener más de ${LIMITES_CLIENTE.telefono} caracteres.`,
      ).regex(PATRON_TELEFONO, {
        error:
          "El teléfono solo puede tener números, espacios y los signos + ( ) . -",
      }),
    )
    .transform(vacioANull),
  notas: textoOpcional(
    LIMITES_CLIENTE.notas,
    `Las notas no pueden tener más de ${LIMITES_CLIENTE.notas} caracteres.`,
  ),
}) satisfies z.ZodType<DatosCliente>;

/** Id de un cliente: un uuid. Se comprueba antes de consultar la base de datos. */
export const esquemaIdCliente = z.guid({ error: "El cliente no es válido." });

export function esIdCliente(valor: unknown): valor is string {
  return esquemaIdCliente.safeParse(valor).success;
}

/** Lee los campos del cliente de un FormData. Lo que no sea texto cuenta como vacío. */
export function leerFormularioCliente(
  formData: FormData,
): ValoresFormularioCliente {
  const leer = (campo: CampoCliente): string => leerTexto(formData, campo);

  return {
    nombre: leer("nombre"),
    empresa: leer("empresa"),
    email: leer("email"),
    telefono: leer("telefono"),
    notas: leer("notas"),
  };
}

export type ResultadoValidacionCliente =
  | { ok: true; datos: DatosCliente }
  | { ok: false; errores: ErroresCliente };

/** Valida los datos de un cliente y devuelve el primer error de cada campo. */
export function validarCliente(entrada: unknown): ResultadoValidacionCliente {
  const resultado = esquemaCliente.safeParse(entrada);
  if (resultado.success) {
    return { ok: true, datos: resultado.data };
  }

  const errores: ErroresCliente = {};
  for (const issue of resultado.error.issues) {
    const campo = CAMPOS_CLIENTE.find((nombre) => nombre === issue.path[0]);
    if (campo && !errores[campo]) {
      errores[campo] = issue.message;
    }
  }
  return { ok: false, errores };
}
