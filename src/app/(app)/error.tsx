"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { BOTON_PRIMARIO, TARJETA } from "@/components/ui/clases";

/**
 * Se muestra si falla la carga de una página de la zona privada (por ejemplo,
 * si la base de datos no responde). No enseña el error interno.
 */
export default function ErrorZonaPrivada({ retry }: { retry: () => void }) {
  return (
    <div
      role="alert"
      className={`${TARJETA} mx-auto flex max-w-lg flex-col items-center px-6 py-10 text-center`}
    >
      <span
        aria-hidden="true"
        className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600"
      >
        <TriangleAlert className="size-6" />
      </span>
      <h1 className="text-lg font-semibold text-texto">
        No se han podido cargar los datos
      </h1>
      <p className="mt-1 text-sm text-texto-suave">
        Puede ser un problema momentáneo. Inténtalo de nuevo en unos segundos.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className={`mt-6 ${BOTON_PRIMARIO}`}
      >
        <RotateCw aria-hidden="true" className="size-4" />
        Reintentar
      </button>
    </div>
  );
}
