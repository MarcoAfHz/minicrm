import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Suspense } from "react";
import {
  BOTON_PRIMARIO,
  ENLACE_VOLVER,
  TARJETA,
  TITULO_PAGINA,
} from "@/components/ui/clases";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { requerirUsuario } from "@/lib/supabase/usuario";
import { listarOpcionesClientes } from "../../clientes/datos";
import { FormularioOportunidad } from "../formulario-oportunidad";

export const metadata: Metadata = {
  title: "Nueva oportunidad",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function PaginaNuevaOportunidad({ searchParams }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Suspense
        fallback={
          <>
            <Titulo />
            <p className="text-texto-suave">Cargando…</p>
          </>
        }
      >
        <Formulario searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Formulario({ searchParams }: Props) {
  const usuario = await requerirUsuario();
  const clientes = await listarOpcionesClientes(usuario.id);

  // ?cliente=<id> preselecciona ese cliente (si es del usuario) y, al terminar,
  // se vuelve a su ficha.
  const { cliente } = await searchParams;
  const clienteInicial = clientes.find((opcion) => opcion.id === cliente)?.id;

  if (clientes.length === 0) {
    return (
      <>
        <Titulo />
        <EstadoVacio icono={Users} amplio>
          <p className="font-medium text-texto">
            Para crear una oportunidad, primero necesitas un cliente.
          </p>
          <p className="mt-1 text-sm text-texto-suave">
            Cada oportunidad de venta pertenece a un cliente. Da de alta el
            primero y vuelve aquí.
          </p>
          <Link href="/clientes/nuevo" className={`mt-4 ${BOTON_PRIMARIO}`}>
            Nuevo cliente
          </Link>
        </EstadoVacio>
      </>
    );
  }

  return (
    <>
      <Link
        href={clienteInicial ? `/clientes/${clienteInicial}` : "/oportunidades"}
        className={ENLACE_VOLVER}
      >
        {clienteInicial
          ? "← Volver a la ficha del cliente"
          : "← Volver a oportunidades"}
      </Link>
      <Titulo />
      <div className={`${TARJETA} p-4 sm:p-6`}>
        <FormularioOportunidad
          clientes={clientes}
          clienteInicial={clienteInicial}
          volver={clienteInicial !== undefined}
        />
      </div>
    </>
  );
}

function Titulo() {
  return (
    <h1 className={TITULO_PAGINA}>Nueva oportunidad</h1>
  );
}
