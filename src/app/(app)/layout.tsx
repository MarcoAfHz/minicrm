import type { ReactNode } from "react";
import { Suspense } from "react";
import { Cabecera } from "@/components/cabecera";
import { requerirUsuario } from "@/lib/supabase/usuario";

type Props = Readonly<{ children: ReactNode }>;

/**
 * Zona privada. La sesión se comprueba en el servidor antes de mostrar nada:
 * sin usuario, se redirige a /login (D7).
 */
export default function LayoutZonaPrivada({ children }: Props) {
  return (
    <Suspense fallback={<Cargando />}>
      <ZonaPrivada>{children}</ZonaPrivada>
    </Suspense>
  );
}

async function ZonaPrivada({ children }: Props) {
  const usuario = await requerirUsuario();

  return (
    <>
      <Cabecera email={usuario.email ?? ""} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}

function Cargando() {
  return (
    <p className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-zinc-600">
      Cargando…
    </p>
  );
}
