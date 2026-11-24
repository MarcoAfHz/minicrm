import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

/** 404 de toda la app: direcciones que no existen. */
export default function PaginaNoEncontrada() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-zinc-500">Error 404</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Esta página no existe
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Puede que el enlace esté mal escrito o que la página se haya movido.
        </p>
        <Link
          href="/panel"
          className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Ir al panel
        </Link>
      </div>
    </main>
  );
}
