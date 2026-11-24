import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
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
            <p className="text-zinc-600">Cargando…</p>
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
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
          <p className="font-medium text-zinc-900">
            Para crear una oportunidad, primero necesitas un cliente.
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Cada oportunidad de venta pertenece a un cliente. Da de alta el
            primero y vuelve aquí.
          </p>
          <Link
            href="/clientes/nuevo"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Nuevo cliente
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Link
        href={clienteInicial ? `/clientes/${clienteInicial}` : "/oportunidades"}
        className="self-start text-sm text-zinc-700 hover:text-zinc-950 hover:underline"
      >
        {clienteInicial
          ? "← Volver a la ficha del cliente"
          : "← Volver a oportunidades"}
      </Link>
      <Titulo />
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
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
    <h1 className="text-2xl font-semibold text-zinc-900">Nueva oportunidad</h1>
  );
}
