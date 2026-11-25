"use client";

import { LayoutDashboard, SquareKanban, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { esRutaActiva } from "@/lib/navegacion";

const ENLACES = [
  { href: "/panel", texto: "Panel", icono: LayoutDashboard },
  { href: "/clientes", texto: "Clientes", icono: Users },
  { href: "/oportunidades", texto: "Oportunidades", icono: SquareKanban },
] as const;

const ESTILOS = {
  /** Barra lateral oscura (escritorio). */
  lateral: {
    nav: "flex-1 px-3 py-4",
    lista: "flex flex-col gap-1",
    enlace:
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-marca-400",
    activo: "bg-white/10 text-white",
    inactivo: "text-lateral-texto hover:bg-white/5 hover:text-white",
    icono: "size-5 shrink-0",
    iconoActivo: "text-marca-300",
    iconoInactivo: "text-lateral-tenue",
  },
  /** Barra inferior fija (móvil y tableta). */
  inferior: {
    nav: "fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-superficie/95 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur lg:hidden",
    lista: "grid grid-cols-3",
    enlace:
      "relative flex min-w-0 flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-xs font-medium transition-colors focus-visible:-outline-offset-2",
    activo:
      "text-marca-700 before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:rounded-full before:bg-marca-600",
    inactivo: "text-texto-suave hover:text-texto",
    icono: "size-5 shrink-0",
    iconoActivo: "text-marca-600",
    iconoInactivo: "",
  },
} as const;

/**
 * Enlaces principales de la zona privada. En escritorio van en la barra
 * lateral; en móvil y tableta, en una barra fija abajo. El enlace de la sección
 * actual se resalta y lleva `aria-current="page"`.
 */
export function Navegacion({ variante }: { variante: keyof typeof ESTILOS }) {
  const ruta = usePathname();
  const estilos = ESTILOS[variante];

  return (
    <nav aria-label="Principal" className={estilos.nav}>
      <ul className={estilos.lista}>
        {ENLACES.map(({ href, texto, icono: Icono }) => {
          const activo = esRutaActiva(ruta, href);
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`${estilos.enlace} ${activo ? estilos.activo : estilos.inactivo}`}
              >
                <Icono
                  aria-hidden="true"
                  className={`${estilos.icono} ${activo ? estilos.iconoActivo : estilos.iconoInactivo}`}
                />
                <span className="max-w-full truncate">{texto}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
