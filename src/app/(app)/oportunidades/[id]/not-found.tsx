import Link from "next/link";

/** Se muestra si la oportunidad no existe o es de otro usuario. */
export default function OportunidadNoEncontrada() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
      <h1 className="text-lg font-semibold text-zinc-900">
        No hemos encontrado esta oportunidad
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Puede que se haya borrado o que el enlace no sea correcto.
      </p>
      <Link
        href="/oportunidades"
        className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Ver mis oportunidades
      </Link>
    </div>
  );
}
