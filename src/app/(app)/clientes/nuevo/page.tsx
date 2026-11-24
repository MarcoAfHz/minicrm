import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requerirUsuario } from "@/lib/supabase/usuario";
import { FormularioCliente } from "../formulario-cliente";

export const metadata: Metadata = {
  title: "Nuevo cliente",
};

export default function PaginaNuevoCliente() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link
        href="/clientes"
        className="self-start text-sm text-zinc-700 hover:text-zinc-950 hover:underline"
      >
        ← Volver a clientes
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-900">Nuevo cliente</h1>
      <Suspense fallback={<p className="text-zinc-600">Cargando…</p>}>
        <Formulario />
      </Suspense>
    </section>
  );
}

async function Formulario() {
  await requerirUsuario();

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
      <FormularioCliente />
    </div>
  );
}
