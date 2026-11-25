import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icono: LucideIcon;
  children: ReactNode;
  /** Más aire arriba y abajo (para el estado vacío principal de una pantalla). */
  amplio?: boolean;
};

/** Caja de borde discontinuo con un icono para cuando no hay datos que mostrar. */
export function EstadoVacio({ icono: Icono, children, amplio = false }: Props) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border border-dashed border-borde-fuerte bg-superficie px-4 text-center ${amplio ? "py-10" : "py-8"}`}
    >
      <span
        aria-hidden="true"
        className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-marca-50 text-marca-600"
      >
        <Icono className="size-6" />
      </span>
      {children}
    </div>
  );
}
