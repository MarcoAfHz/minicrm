import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requerirUsuario } from "@/lib/supabase/usuario";
import { obtenerCliente } from "../../datos";
import { FormularioCliente } from "../../formulario-cliente";

export const metadata: Metadata = {
  title: "Editar cliente",
};

type Props = { params: Promise<{ id: string }> };

export default function PaginaEditarCliente({ params }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Suspense fallback={<p className="text-zinc-600">Cargando…</p>}>
        <Edicion params={params} />
      </Suspense>
    </section>
  );
}

async function Edicion({ params }: Props) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const cliente = await obtenerCliente(id, usuario.id);
  if (!cliente) {
    notFound();
  }

  return (
    <>
      <Link
        href={`/clientes/${cliente.id}`}
        className="self-start text-sm text-zinc-700 hover:text-zinc-950 hover:underline"
      >
        ← Volver a la ficha
      </Link>
      <h1 className="break-words text-2xl font-semibold text-zinc-900">
        Editar «{cliente.nombre}»
      </h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
        <FormularioCliente cliente={cliente} />
      </div>
    </>
  );
}
