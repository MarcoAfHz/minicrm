import { z } from "zod";
import { ETAPAS, importeACentimos } from "@/lib/embudo";
import type { ResultadoFormulario } from "@/lib/resultado";
import type { DatosOportunidad, Etapa, Importe } from "@/lib/tipos";
import { caracteres, leerTexto, textoRecortado, vacioANull } from "./comun";

export const CAMPOS_OPORTUNIDAD = [
  "cliente_id",
  "titulo",
  "importe",
  "etapa",
  "fecha_cierre_prevista",
] as const;

export type CampoOportunidad = (typeof CAMPOS_OPORTUNIDAD)[number];

/** Lo que se ha escrito en cada campo del formulario, tal cual. */
export type ValoresFormularioOportunidad = Record<CampoOportunidad, string>;

/** Un mensaje por campo con error. */
export type ErroresOportunidad = Partial<Record<CampoOportunidad, string>>;

/** Lo que devuelven las Server Actions de crear y editar una oportunidad. */
export type EstadoFormularioOportunidad = ResultadoFormulario<CampoOportunidad>;

/**
 * Límites: los mismos que los `check` de la migración. El título se mide en
 * caracteres (code points), como `char_length`.
 */
export const LIMITES_OPORTUNIDAD = {
  titulo: { min: 2, max: 120 },
  /** El mayor valor que cabe en numeric(12,2): 10 cifras enteras y 2 decimales. */
  importeMaximo: 9_999_999_999.99,
} as const;

const CIFRAS_ENTERAS_MAXIMAS = 10;

const ERROR_IMPORTE_NO_VALIDO =
  "Escribe un importe válido, por ejemplo 1.234,56.";
const ERROR_IMPORTE_NEGATIVO = "El importe no puede ser negativo.";
const ERROR_IMPORTE_DECIMALES =
  "El importe puede tener como máximo 2 decimales.";
const ERROR_IMPORTE_MAXIMO =
  "El importe no puede ser mayor que 9.999.999.999,99 €.";

/**
 * Miles con punto: 1.234 o 1.234.567 (cada grupo, de 3 cifras). El primer
 * grupo no puede empezar por 0: "0.500" no son 500 €, así que se lee como
 * decimales (y da el error de "como máximo 2 decimales").
 */
const PATRON_MILES = /^[1-9]\d{0,2}(\.\d{3})+$/;

export type ResultadoImporte =
  { ok: true; importe: number } | { ok: false; error: string };

/**
 * Lee un importe en euros escrito a mano. Acepta "1234,56", "1.234,56" y
 * "1234.56" (y el símbolo € o espacios). Con solo puntos, "1.234" son miles y
 * "1.5" son decimales. Vacío cuenta como 0. Devuelve el importe en euros o el
 * motivo por el que no es válido.
 */
export function interpretarImporte(texto: string): ResultadoImporte {
  const limpio = texto.replace(/\s/g, "").replace(/€$/, "");
  if (limpio === "") {
    return { ok: true, importe: 0 };
  }
  if (limpio.startsWith("-")) {
    return {
      ok: false,
      error: /^-[\d.,]+$/.test(limpio)
        ? ERROR_IMPORTE_NEGATIVO
        : ERROR_IMPORTE_NO_VALIDO,
    };
  }
  if (!/^[\d.,]+$/.test(limpio)) {
    return { ok: false, error: ERROR_IMPORTE_NO_VALIDO };
  }

  const partes = separarImporte(limpio);
  if (!partes) {
    return { ok: false, error: ERROR_IMPORTE_NO_VALIDO };
  }
  const { entera, decimales } = partes;
  if (decimales.length > 2) {
    return { ok: false, error: ERROR_IMPORTE_DECIMALES };
  }
  if (entera.replace(/^0+(?=\d)/, "").length > CIFRAS_ENTERAS_MAXIMAS) {
    return { ok: false, error: ERROR_IMPORTE_MAXIMO };
  }

  // Se calcula en céntimos enteros para no arrastrar errores de coma flotante.
  const centimos = Number(entera) * 100 + Number(decimales.padEnd(2, "0"));
  return { ok: true, importe: centimos / 100 };
}

/** Separa la parte entera (sin puntos de miles) y los decimales, o null si el formato no vale. */
function separarImporte(
  limpio: string,
): { entera: string; decimales: string } | null {
  const porComa = limpio.split(",");
  let entera: string;
  let decimales: string;

  if (porComa.length > 2) {
    return null;
  }
  if (porComa.length === 2) {
    // Formato español: la coma separa los decimales y los puntos, los miles.
    [entera, decimales] = porComa;
    if (entera.includes(".")) {
      if (!PATRON_MILES.test(entera)) {
        return null;
      }
      entera = entera.replaceAll(".", "");
    }
    if (decimales === "") {
      return null;
    }
  } else if (!limpio.includes(".")) {
    entera = limpio;
    decimales = "";
  } else if (PATRON_MILES.test(limpio)) {
    entera = limpio.replaceAll(".", "");
    decimales = "";
  } else {
    const porPunto = limpio.split(".");
    if (porPunto.length !== 2 || porPunto[1] === "") {
      return null;
    }
    [entera, decimales] = porPunto;
  }

  if (!/^\d+$/.test(entera) || !/^\d*$/.test(decimales)) {
    return null;
  }
  return { entera, decimales };
}

/** Un importe guardado, escrito como en el formulario: "1234,50". */
export function importeATexto(importe: Importe): string {
  const centimos = Math.abs(importeACentimos(importe));
  const euros = Math.trunc(centimos / 100);
  const resto = String(centimos % 100).padStart(2, "0");
  return `${euros},${resto}`;
}

/** Comprueba que una fecha YYYY-MM-DD exista (nada de 30 de febrero). */
export function esFechaValida(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) {
    return false;
  }
  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  // PostgreSQL no tiene año 0 y una fecha de cierre tan antigua no tiene sentido.
  if (anio < 1900) {
    return false;
  }
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

const esquemaUuid = z.guid();

const esquemaEtapa = z.enum(ETAPAS, { error: "Elige una etapa válida." });

export const esquemaOportunidad = z.object({
  cliente_id: textoRecortado.pipe(
    z
      .string()
      .min(1, { error: "Elige un cliente." })
      .refine((valor) => valor === "" || esquemaUuid.safeParse(valor).success, {
        error: "Elige un cliente de la lista.",
      }),
  ),
  titulo: textoRecortado.pipe(
    z
      .string()
      .min(1, { error: "Escribe el título de la oportunidad." })
      .refine((valor) => caracteres(valor) >= LIMITES_OPORTUNIDAD.titulo.min, {
        error: `El título tiene que tener al menos ${LIMITES_OPORTUNIDAD.titulo.min} caracteres.`,
      })
      .refine((valor) => caracteres(valor) <= LIMITES_OPORTUNIDAD.titulo.max, {
        error: `El título no puede tener más de ${LIMITES_OPORTUNIDAD.titulo.max} caracteres.`,
      }),
  ),
  importe: textoRecortado.transform((valor, ctx) => {
    const resultado = interpretarImporte(valor);
    if (!resultado.ok) {
      ctx.addIssue({ code: "custom", message: resultado.error });
      return z.NEVER;
    }
    return resultado.importe;
  }),
  etapa: textoRecortado.pipe(esquemaEtapa),
  fecha_cierre_prevista: textoRecortado
    .refine((valor) => valor === "" || esFechaValida(valor), {
      error: "Introduce una fecha válida.",
    })
    .transform(vacioANull),
}) satisfies z.ZodType<DatosOportunidad>;

/** Id de una oportunidad: un uuid. Se comprueba antes de consultar la base de datos. */
export const esquemaIdOportunidad = z.guid({
  error: "La oportunidad no es válida.",
});

export function esIdOportunidad(valor: unknown): valor is string {
  return esquemaIdOportunidad.safeParse(valor).success;
}

/** Lee los campos de la oportunidad de un FormData. Lo que no sea texto cuenta como vacío. */
export function leerFormularioOportunidad(
  formData: FormData,
): ValoresFormularioOportunidad {
  const leer = (campo: CampoOportunidad): string => leerTexto(formData, campo);

  return {
    cliente_id: leer("cliente_id"),
    titulo: leer("titulo"),
    importe: leer("importe"),
    etapa: leer("etapa"),
    fecha_cierre_prevista: leer("fecha_cierre_prevista"),
  };
}

export type ResultadoValidacionOportunidad =
  | { ok: true; datos: DatosOportunidad }
  | { ok: false; errores: ErroresOportunidad };

/** Valida los datos de una oportunidad y devuelve el primer error de cada campo. */
export function validarOportunidad(
  entrada: unknown,
): ResultadoValidacionOportunidad {
  const resultado = esquemaOportunidad.safeParse(entrada);
  if (resultado.success) {
    return { ok: true, datos: resultado.data };
  }

  const errores: ErroresOportunidad = {};
  for (const issue of resultado.error.issues) {
    const campo = CAMPOS_OPORTUNIDAD.find((nombre) => nombre === issue.path[0]);
    if (campo && !errores[campo]) {
      errores[campo] = issue.message;
    }
  }
  return { ok: false, errores };
}

/** Lo que llega al mover una oportunidad de etapa desde su tarjeta. */
export const esquemaCambioEtapa = z.object({
  id: esquemaIdOportunidad,
  etapa: esquemaEtapa,
});

export type ResultadoCambioEtapa =
  | { ok: true; datos: { id: string; etapa: Etapa } }
  | { ok: false; error: string };

/** Valida el cambio de etapa y devuelve el primer error. */
export function validarCambioEtapa(entrada: unknown): ResultadoCambioEtapa {
  const resultado = esquemaCambioEtapa.safeParse(entrada);
  if (resultado.success) {
    return { ok: true, datos: resultado.data };
  }
  // Solo se enseñan los mensajes propios de los campos (los de Zod van en inglés).
  const issue = resultado.error.issues.find(
    ({ path }) => path[0] === "id" || path[0] === "etapa",
  );
  return { ok: false, error: issue?.message ?? "Elige una etapa válida." };
}

/**
 * Las páginas de oportunidad que se abren desde la ficha de un cliente mandan
 * `volver=cliente` para volver a esa ficha al terminar. Cualquier otro valor
 * vuelve al tablero (así no se puede redirigir a una dirección cualquiera).
 */
export function volverAlCliente(valor: unknown): boolean {
  return z.literal("cliente").safeParse(valor).success;
}
