import { ChartColumnBig, Users, SquareKanban } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TARJETA } from "@/components/ui/clases";
import { IconoLogo, Logo } from "@/components/ui/logo";
import { obtenerUsuario } from "@/lib/supabase/usuario";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

const VENTAJAS = [
  { icono: Users, texto: "Todos tus clientes y sus datos de contacto" },
  { icono: SquareKanban, texto: "Un embudo de ventas por etapas" },
  { icono: ChartColumnBig, texto: "Las cifras del mes de un vistazo" },
] as const;

/**
 * En pantallas medianas y grandes, dos columnas: la marca a la izquierda y el
 * formulario a la derecha. En el móvil, solo el formulario con el logo arriba.
 */
export default function PaginaLogin() {
  return (
    <main className="grid flex-1 md:grid-cols-2">
      <Suspense fallback={null}>
        <RedirigirSiHaySesion />
      </Suspense>

      <PanelMarca />

      <div className="flex flex-col items-center justify-center gap-8 px-4 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <div className="md:hidden">
          <IconoLogo grande />
        </div>
        <div className={`${TARJETA} w-full max-w-sm p-6 sm:p-8`}>
          <h1 className="text-2xl font-semibold tracking-tight text-texto">
            Mini CRM
          </h1>
          <p className="mt-1 mb-6 text-sm text-texto-suave">
            Entra con tu email y tu contraseña.
          </p>
          <FormularioLogin />
        </div>
      </div>
    </main>
  );
}

function PanelMarca() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-marca-600 via-marca-700 to-marca-950 p-10 text-white md:flex lg:p-14">
      {/* Círculos de fondo, solo decorativos. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-marca-400/20 blur-3xl"
      />

      <div className="relative">
        <Logo oscuro />
      </div>

      <div className="relative flex max-w-md flex-col gap-8">
        <p className="text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">
          Tus clientes y ventas, en un solo sitio
        </p>
        <ul className="flex flex-col gap-4">
          {VENTAJAS.map(({ icono: Icono, texto }) => (
            <li key={texto} className="flex items-center gap-3 text-marca-50">
              <span
                aria-hidden="true"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15"
              >
                <Icono className="size-5" />
              </span>
              {texto}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-sm text-marca-100">
        Para comerciales y pymes.
      </p>
    </div>
  );
}

async function RedirigirSiHaySesion() {
  const usuario = await obtenerUsuario();
  if (usuario) {
    redirect("/panel");
  }
  return null;
}
