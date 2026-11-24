/** Lo que devuelve toda Server Action (D3). */
export type ResultadoAccion = { ok: true } | { ok: false; error: string };

/**
 * Resultado de una Server Action de formulario: además del error general,
 * puede traer un error por campo y lo que se había escrito, para volver a
 * mostrarlo en el formulario.
 */
export type ResultadoFormulario<Campo extends string> =
  | { ok: true }
  | {
      ok: false;
      error: string;
      errores?: Partial<Record<Campo, string>>;
      valores?: Record<Campo, string>;
    };
