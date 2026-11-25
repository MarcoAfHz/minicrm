import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ENLACE_VOLVER, TARJETA, TITULO_PAGINA } from "@/components/ui/clases";
import { requerirUsuario } from "@/lib/supabase/usuario";
import { FormularioCliente } from "../formulario-cliente";

export const metadata: Metadata = {
  title: "Nuevo cliente",
};

export default function PaginaNuevoCliente() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link href="/clientes" className={ENLACE_VOLVER}>
        ← Volver a clientes
      </Link>
      <h1 className={TITULO_PAGINA}>Nuevo cliente</h1>
      <Suspense fallback={<p className="text-texto-suave">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </section>
  );
}

async function Formulario() {
  await requerirUsuario();

  return (
    <div className={`${TARJETA} p-4 sm:p-6`}>
      <FormularioCliente />
    </div>
  );
}
