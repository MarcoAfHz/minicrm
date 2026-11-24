"use client";

import { type SubmitEvent, useActionState } from "react";
import { borrarOportunidad } from "./actions";

type Props = { id: string; titulo: string; volver: boolean };

/** Botón para borrar una oportunidad. Pide confirmación antes de llamar a la acción. */
export function BotonBorrarOportunidad({ id, titulo, volver }: Props) {
  const [estado, accion, enviando] = useActionState(borrarOportunidad, null);

  function confirmar(evento: SubmitEvent<HTMLFormElement>) {
    const seguro = window.confirm(
      `¿Seguro que quieres borrar la oportunidad «${titulo}»? Esta acción no se puede deshacer.`,
    );
    if (!seguro) {
      evento.preventDefault();
    }
  }

  return (
    <form action={accion} onSubmit={confirmar} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      {volver ? <input type="hidden" name="volver" value="cliente" /> : null}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-md border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Borrando…" : "Borrar"}
      </button>
      {estado && !estado.ok ? (
        <p role="alert" className="text-sm text-red-700">
          {estado.error}
        </p>
      ) : null}
    </form>
  );
}
