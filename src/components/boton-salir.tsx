"use client";

import { LogOut } from "lucide-react";
import { useActionState } from "react";
import { cerrarSesion } from "@/app/(app)/actions";
import { BOTON_SECUNDARIO_PEQUENO } from "@/components/ui/clases";

const ESTILOS = {
  /** En la barra lateral oscura: ocupa todo el ancho. */
  lateral: {
    formulario: "flex flex-col gap-2",
    boton:
      "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium text-lateral-texto transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-marca-400 disabled:cursor-not-allowed disabled:opacity-60",
    error: "text-xs text-red-300",
  },
  /** En la cabecera clara del móvil. */
  cabecera: {
    formulario: "flex items-center gap-2",
    boton: `${BOTON_SECUNDARIO_PEQUENO} shrink-0`,
    error: "text-xs text-red-700",
  },
} as const;

export function BotonSalir({
  variante = "cabecera",
}: {
  variante?: keyof typeof ESTILOS;
}) {
  const [estado, accion, enviando] = useActionState(cerrarSesion, null);
  const estilos = ESTILOS[variante];

  return (
    <form action={accion} className={estilos.formulario}>
      {estado && !estado.ok ? (
        <p role="alert" className={estilos.error}>
          {estado.error}
        </p>
      ) : null}
      <button type="submit" disabled={enviando} className={estilos.boton}>
        <LogOut aria-hidden="true" className="size-4" />
        {enviando ? "Saliendo…" : "Salir"}
      </button>
    </form>
  );
}
