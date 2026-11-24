"use client";

/**
 * Se muestra si falla la carga de una página de la zona privada (por ejemplo,
 * si la base de datos no responde). No enseña el error interno.
 */
export default function ErrorZonaPrivada({ retry }: { retry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center"
    >
      <h1 className="text-lg font-semibold text-red-800">
        No se han podido cargar los datos
      </h1>
      <p className="mt-1 text-sm text-red-700">
        Puede ser un problema momentáneo. Inténtalo de nuevo en unos segundos.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Reintentar
      </button>
    </div>
  );
}
