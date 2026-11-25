import type { ReactNode } from "react";
import { Suspense } from "react";
import { BarraLateral } from "@/components/barra-lateral";
import { Cabecera } from "@/components/cabecera";
import { Navegacion } from "@/components/navegacion";
import { requerirUsuario } from "@/lib/supabase/usuario";

type Props = Readonly<{ children: ReactNode }>;

/** Ancho y márgenes del contenido de todas las pantallas privadas. */
const CONTENIDO = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

/**
 * Zona privada. La sesión se comprueba en el servidor antes de mostrar nada:
 * sin usuario, se redirige a /login (D7).
 *
 * En escritorio (lg) hay una barra lateral fija. En móvil y tableta, una
 * cabecera compacta arriba y las secciones en una barra fija abajo: son solo
 * 3 enlaces, así que caben siempre a la vista y a un toque, sin abrir un menú.
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
  const email = usuario.email ?? "";

  return (
    <div className="flex flex-1 flex-col lg:pl-60">
      <BarraLateral email={email} />
      <Cabecera email={email} />
      {/* Abajo deja sitio para la barra de navegación del móvil. */}
      <main className={`${CONTENIDO} flex-1 pt-6 pb-28 lg:py-8`}>
        {children}
      </main>
      <Navegacion variante="inferior" />
    </div>
  );
}

function Cargando() {
  return (
    <p
      className={`${CONTENIDO} pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 text-sm text-texto-suave lg:pt-6`}
    >
      Cargando…
    </p>
  );
}
