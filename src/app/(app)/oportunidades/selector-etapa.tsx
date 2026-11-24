"use client";

import { useActionState } from "react";
import { ETAPAS, ETIQUETAS_ETAPA } from "@/lib/embudo";
import type { Etapa } from "@/lib/tipos";
import { cambiarEtapa } from "./actions";

type Props = { id: string; titulo: string; etapa: Etapa };

/**
 * Mueve una oportunidad a otra etapa desde su tarjeta. Se elige la etapa y se
 * pulsa «Mover»: así, recorrer las opciones con el teclado no la mueve sin
 * querer. En el móvil, el desplegable abre el selector nativo.
 */
export function SelectorEtapa({ id, titulo, etapa }: Props) {
  const [estado, accion, enviando] = useActionState(cambiarEtapa, null);
  const idCampo = `etapa-${id}`;

  return (
    <form action={accion} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={idCampo} className="sr-only">
        Mover «{titulo}» a otra etapa
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id={idCampo}
          name="etapa"
          required
          defaultValue=""
          className="min-w-24 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-base text-zinc-800 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 sm:text-sm"
        >
          <option value="" disabled>
            Mover a…
          </option>
          {ETAPAS.filter((otra) => otra !== etapa).map((otra) => (
            <option key={otra} value={otra}>
              {ETIQUETAS_ETAPA[otra]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={enviando}
          className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-base font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
        >
          {enviando ? "Moviendo…" : "Mover"}
        </button>
      </div>
      {estado && !estado.ok ? (
        <p role="alert" className="text-sm text-red-700">
          {estado.error}
        </p>
      ) : null}
    </form>
  );
}
