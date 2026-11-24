import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { obtenerUsuario } from "@/lib/supabase/usuario";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function PaginaLogin() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <Suspense fallback={null}>
        <RedirigirSiHaySesion />
      </Suspense>
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Mini CRM</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-600">
          Entra con tu email y tu contraseña.
        </p>
        <FormularioLogin />
      </div>
    </main>
  );
}

async function RedirigirSiHaySesion() {
  const usuario = await obtenerUsuario();
  if (usuario) {
    redirect("/panel");
  }
  return null;
}
