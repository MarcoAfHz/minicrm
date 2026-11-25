import { ETIQUETAS_ETAPA } from "@/lib/embudo";
import type { Etapa } from "@/lib/tipos";

/**
 * Colores de cada etapa (tokens de src/app/globals.css). Es el único sitio que
 * relaciona etapas y clases: lo usan las etiquetas, las columnas del tablero,
 * el embudo del panel y la ficha del cliente.
 */
export const COLORES_ETAPA: Record<
  Etapa,
  {
    /** Fondo y texto de la etiqueta. */
    etiqueta: string;
    /** Borde superior de la columna del tablero. */
    borde: string;
    /** Barra del embudo y punto de color. */
    barra: string;
  }
> = {
  nuevo: {
    etiqueta: "bg-etapa-nuevo-suave text-etapa-nuevo-texto",
    borde: "border-t-etapa-nuevo",
    barra: "bg-etapa-nuevo",
  },
  contactado: {
    etiqueta: "bg-etapa-contactado-suave text-etapa-contactado-texto",
    borde: "border-t-etapa-contactado",
    barra: "bg-etapa-contactado",
  },
  propuesta: {
    etiqueta: "bg-etapa-propuesta-suave text-etapa-propuesta-texto",
    borde: "border-t-etapa-propuesta",
    barra: "bg-etapa-propuesta",
  },
  ganada: {
    etiqueta: "bg-etapa-ganada-suave text-etapa-ganada-texto",
    borde: "border-t-etapa-ganada",
    barra: "bg-etapa-ganada",
  },
  perdida: {
    etiqueta: "bg-etapa-perdida-suave text-etapa-perdida-texto",
    borde: "border-t-etapa-perdida",
    barra: "bg-etapa-perdida",
  },
};

/** Punto del color de la etapa (decorativo). */
export function PuntoEtapa({ etapa }: { etapa: Etapa }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2 shrink-0 rounded-full ${COLORES_ETAPA[etapa].barra}`}
    />
  );
}

/** La etapa de una oportunidad como una etiqueta de color. */
export function EtiquetaEtapa({ etapa }: { etapa: Etapa }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${COLORES_ETAPA[etapa].etiqueta}`}
    >
      <PuntoEtapa etapa={etapa} />
      {ETIQUETAS_ETAPA[etapa]}
    </span>
  );
}
