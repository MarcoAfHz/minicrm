import Link from "next/link";
import { inicialesDeEmail } from "@/lib/avatar";
import { BotonSalir } from "./boton-salir";
import { Avatar } from "./ui/avatar";
import { Logo } from "./ui/logo";

/**
 * Cabecera compacta del móvil y la tableta (en escritorio está la barra
 * lateral). Los enlaces de las secciones van en la barra inferior.
 */
export function Cabecera({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-borde bg-superficie/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/panel" className="shrink-0 rounded-lg">
          <Logo />
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          <Avatar nombre={email} texto={inicialesDeEmail(email)} tamano="sm" />
          {/* En el móvil no cabe: solo lo oyen los lectores de pantalla. */}
          <span className="sr-only sm:hidden">{email}</span>
          <span
            className="hidden max-w-56 truncate text-sm text-texto-suave sm:block"
            title={email}
          >
            {email}
          </span>
          <BotonSalir />
        </div>
      </div>
    </header>
  );
}
