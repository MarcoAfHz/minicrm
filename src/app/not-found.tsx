import { Compass } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BOTON_PRIMARIO, TARJETA } from "@/components/ui/clases";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

/** 404 de toda la app: direcciones que no existen. */
export default function PaginaNoEncontrada() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <Logo />
      <div
        className={`${TARJETA} flex w-full max-w-md flex-col items-center p-8 text-center`}
      >
        <span
          aria-hidden="true"
          className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-marca-50 text-marca-600"
        >
          <Compass className="size-6" />
        </span>
        <p className="text-sm font-semibold text-marca-700">Error 404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-texto">
          Esta página no existe
        </h1>
        <p className="mt-2 text-sm text-texto-suave">
          Puede que el enlace esté mal escrito o que la página se haya movido.
        </p>
        <Link href="/panel" className={`mt-6 ${BOTON_PRIMARIO}`}>
          Ir al panel
        </Link>
      </div>
    </main>
  );
}
