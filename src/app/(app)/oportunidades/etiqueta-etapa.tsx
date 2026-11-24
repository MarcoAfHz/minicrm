import { ETIQUETAS_ETAPA } from "@/lib/embudo";
import type { Etapa } from "@/lib/tipos";

/** Colores de cada etapa: los usan las etiquetas y las columnas del tablero. */
export const COLORES_ETAPA: Record<Etapa, { etiqueta: string; borde: string }> =
  {
    nuevo: {
      etiqueta: "bg-zinc-100 text-zinc-800",
      borde: "border-t-zinc-400",
    },
    contactado: {
      etiqueta: "bg-sky-100 text-sky-800",
      borde: "border-t-sky-500",
    },
    propuesta: {
      etiqueta: "bg-amber-100 text-amber-900",
      borde: "border-t-amber-500",
    },
    ganada: {
      etiqueta: "bg-emerald-100 text-emerald-800",
      borde: "border-t-emerald-600",
    },
    perdida: { etiqueta: "bg-red-100 text-red-800", borde: "border-t-red-500" },
  };

/** La etapa de una oportunidad como una etiqueta de color. */
export function EtiquetaEtapa({ etapa }: { etapa: Etapa }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLORES_ETAPA[etapa].etiqueta}`}
    >
      {ETIQUETAS_ETAPA[etapa]}
    </span>
  );
}
