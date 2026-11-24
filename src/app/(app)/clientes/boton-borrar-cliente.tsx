"use client";

import { type SubmitEvent, useActionState } from "react";
import { borrarCliente } from "./actions";

type Props = { id: string; nombre: string };

/** Botón para borrar un cliente. Pide confirmación antes de llamar a la acción. */
export function BotonBorrarCliente({ id, nombre }: Props) {
  const [estado, accion, enviando] = useActionState(borrarCliente, null);

  function confirmar(evento: SubmitEvent<HTMLFormElement>) {
    const seguro = window.confirm(
      `¿Seguro que quieres borrar a «${nombre}»? Esta acción no se puede deshacer.`,
    );
    if (!seguro) {
      evento.preventDefault();
    }
  }

  return (
    <form action={accion} onSubmit={confirmar} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
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
