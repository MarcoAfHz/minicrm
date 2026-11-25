import { redirect } from "next/navigation";
import { Suspense } from "react";
import { obtenerUsuario } from "@/lib/supabase/usuario";

/** La portada solo redirige: a /panel con sesión y a /login sin ella. */
export default function Inicio() {
  return (
    <Suspense
      fallback={<p className="px-4 py-6 text-sm text-texto-suave">Cargando…</p>}
    >
      <Redirigir />
    </Suspense>
  );
}

async function Redirigir() {
  const usuario = await obtenerUsuario();
  return redirect(usuario ? "/panel" : "/login");
}
