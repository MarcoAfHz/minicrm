"use client";

import { useActionState } from "react";
import { cerrarSesion } from "@/app/(app)/actions";

export function BotonSalir() {
  const [estado, accion, enviando] = useActionState(cerrarSesion, null);

  return (
    <form action={accion} className="flex items-center gap-2">
      {estado && !estado.ok ? (
        <p role="alert" className="text-xs text-red-700">
          {estado.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando}
        className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Saliendo…" : "Salir"}
      </button>
    </form>
  );
}
