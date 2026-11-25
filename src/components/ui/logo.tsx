import { ChartNoAxesCombined } from "lucide-react";

/** Icono de la app en un cuadrado índigo. Decorativo. */
export function IconoLogo({ grande = false }: { grande?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-marca-600 text-white shadow-tarjeta ${grande ? "size-11" : "size-8"}`}
    >
      <ChartNoAxesCombined className={grande ? "size-6" : "size-5"} />
    </span>
  );
}

/** Icono y nombre de la app. `oscuro`: sobre un fondo oscuro. */
export function Logo({ oscuro = false }: { oscuro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <IconoLogo />
      <span
        className={`text-lg font-semibold tracking-tight ${oscuro ? "text-white" : "text-texto"}`}
      >
        Mini CRM
      </span>
    </span>
  );
}
