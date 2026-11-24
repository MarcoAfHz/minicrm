import type { Metadata } from "next";
import { Suspense } from "react";
import { requerirUsuario } from "@/lib/supabase/usuario";

export const metadata: Metadata = {
  title: "Clientes",
};

// Página provisional: la sección se construye en una funcionalidad posterior
// de docs/PLAN.md. Existe para que el enlace de la cabecera no dé un 404.
export default function PaginaClientes() {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-zinc-900">Clientes</h1>
      <Suspense fallback={<p className="text-zinc-600">Cargando…</p>}>
        <Contenido />
      </Suspense>
    </section>
  );
}

async function Contenido() {
  await requerirUsuario();

  return (
    <p className="text-zinc-600">
      Aquí podrás dar de alta tus clientes, buscarlos y editarlos. Esta sección
      estará disponible muy pronto.
    </p>
  );
}
