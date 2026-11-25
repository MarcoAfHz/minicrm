import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ENLACE_VOLVER, TARJETA, TITULO_PAGINA } from "@/components/ui/clases";
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
      <Suspense fallback={<p className="text-texto-suave">Cargando…</p>}>
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
      <Link href={`/clientes/${cliente.id}`} className={ENLACE_VOLVER}>
        ← Volver a la ficha
      </Link>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar nombre={cliente.nombre} />
        <h1 className={`min-w-0 break-words ${TITULO_PAGINA}`}>
          Editar «{cliente.nombre}»
        </h1>
      </div>
      <div className={`${TARJETA} p-4 sm:p-6`}>
        <FormularioCliente cliente={cliente} />
      </div>
    </>
  );
}
