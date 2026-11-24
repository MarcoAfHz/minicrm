import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requerirUsuario } from "@/lib/supabase/usuario";
import { volverAlCliente } from "@/lib/validacion/oportunidad";
import { listarOpcionesClientes } from "../../../clientes/datos";
import { BotonBorrarOportunidad } from "../../boton-borrar-oportunidad";
import { obtenerOportunidad } from "../../datos";
import { FormularioOportunidad } from "../../formulario-oportunidad";

export const metadata: Metadata = {
  title: "Editar oportunidad",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function PaginaEditarOportunidad(props: Props) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Suspense fallback={<p className="text-zinc-600">Cargando…</p>}>
        <Edicion {...props} />
      </Suspense>
    </section>
  );
}

async function Edicion({ params, searchParams }: Props) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const [oportunidad, clientes] = await Promise.all([
    obtenerOportunidad(id, usuario.id),
    listarOpcionesClientes(usuario.id),
  ]);
  if (!oportunidad) {
    notFound();
  }

  // ?volver=cliente: se ha abierto desde la ficha del cliente y se vuelve allí.
  const volver = volverAlCliente((await searchParams).volver);

  return (
    <>
      <Link
        href={volver ? `/clientes/${oportunidad.cliente_id}` : "/oportunidades"}
        className="self-start text-sm text-zinc-700 hover:text-zinc-950 hover:underline"
      >
        {volver
          ? "← Volver a la ficha del cliente"
          : "← Volver a oportunidades"}
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="min-w-0 break-words text-2xl font-semibold text-zinc-900">
          Editar «{oportunidad.titulo}»
        </h1>
        <div className="shrink-0">
          <BotonBorrarOportunidad
            id={oportunidad.id}
            titulo={oportunidad.titulo}
            volver={volver}
          />
        </div>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
        <FormularioOportunidad
          clientes={clientes}
          oportunidad={oportunidad}
          volver={volver}
        />
      </div>
    </>
  );
}
