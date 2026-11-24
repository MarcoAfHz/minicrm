import type { Metadata } from "next";
import { Suspense } from "react";
import { requerirUsuario } from "@/lib/supabase/usuario";

export const metadata: Metadata = {
  title: "Panel",
};

export default function PaginaPanel() {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-zinc-900">Panel</h1>
      <Suspense fallback={<p className="text-zinc-600">Cargando…</p>}>
        <Bienvenida />
      </Suspense>
    </section>
  );
}

async function Bienvenida() {
  const usuario = await requerirUsuario();

  return (
    <p className="text-zinc-600">
      Hola, <span className="break-all">{usuario.email}</span>. Aquí verás el
      resumen de tus clientes y oportunidades.
    </p>
  );
}
