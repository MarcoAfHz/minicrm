import Link from "next/link";
import { inicialesDeEmail } from "@/lib/avatar";
import { BotonSalir } from "./boton-salir";
import { Navegacion } from "./navegacion";
import { Avatar } from "./ui/avatar";
import { Logo } from "./ui/logo";

/** Barra lateral oscura del escritorio: logo, secciones y usuario. */
export function BarraLateral({ email }: { email: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-lateral lg:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link
          href="/panel"
          className="rounded-lg focus-visible:outline-marca-400"
        >
          <Logo oscuro />
        </Link>
      </div>

      <Navegacion variante="lateral" />

      <div className="flex flex-col gap-3 border-t border-white/10 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar nombre={email} texto={inicialesDeEmail(email)} tamano="sm" />
          <span
            className="min-w-0 truncate text-sm text-lateral-texto"
            title={email}
          >
            {email}
          </span>
        </div>
        <BotonSalir variante="lateral" />
      </div>
    </aside>
  );
}
