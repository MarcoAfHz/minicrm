import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { LONGITUD_MAXIMA_BUSQUEDA, normalizarBusqueda } from "@/lib/busqueda";
import { requerirUsuario } from "@/lib/supabase/usuario";
import type { ClienteResumen } from "@/lib/tipos";
import { listarClientes } from "./datos";

export const metadata: Metadata = {
  title: "Clientes",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function PaginaClientes({ searchParams }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Nuevo cliente
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-600">Cargando…</p>}>
        <Listado searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Listado({ searchParams }: Props) {
  await requerirUsuario();
  const busqueda = normalizarBusqueda((await searchParams).q);
  const clientes = await listarClientes(busqueda);

  return (
    <div className="flex flex-col gap-4">
      <Buscador busqueda={busqueda} />

      {clientes.length === 0 ? (
        <SinClientes busqueda={busqueda} />
      ) : (
        <>
          <p className="text-sm text-zinc-600">
            {busqueda
              ? `${clientes.length} ${clientes.length === 1 ? "cliente encontrado" : "clientes encontrados"}`
              : `${clientes.length} ${clientes.length === 1 ? "cliente" : "clientes"}`}
          </p>
          <ListaClientes clientes={clientes} />
        </>
      )}
    </div>
  );
}

function Buscador({ busqueda }: { busqueda: string }) {
  return (
    <Form action="/clientes" className="flex flex-col gap-1" role="search">
      <label htmlFor="q" className="text-sm font-medium text-zinc-800">
        Buscar por nombre o empresa
      </label>
      <div className="flex gap-2">
        <input
          // Al cambiar la búsqueda (p. ej. al quitarla) el campo se vuelve a crear
          // con el texto nuevo.
          key={busqueda}
          id="q"
          name="q"
          type="search"
          defaultValue={busqueda}
          maxLength={LONGITUD_MAXIMA_BUSQUEDA}
          placeholder="Ej.: Ana o Acme"
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Buscar
        </button>
      </div>
      {busqueda ? (
        <Link
          href="/clientes"
          className="self-start text-sm text-zinc-700 underline hover:text-zinc-950"
        >
          Quitar la búsqueda
        </Link>
      ) : null}
    </Form>
  );
}

function SinClientes({ busqueda }: { busqueda: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
      {busqueda ? (
        <>
          <p className="font-medium text-zinc-900">
            Ningún cliente coincide con «
            <span className="break-all">{busqueda}</span>».
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Prueba con otra parte del nombre o de la empresa, o{" "}
            <Link href="/clientes" className="underline hover:text-zinc-950">
              mira todos tus clientes
            </Link>
            .
          </p>
        </>
      ) : (
        <>
          <p className="font-medium text-zinc-900">
            Todavía no tienes clientes.
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Pulsa «Nuevo cliente» para dar de alta el primero.
          </p>
          <Link
            href="/clientes/nuevo"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Nuevo cliente
          </Link>
        </>
      )}
    </div>
  );
}

const SIN_DATO = "—";

function ListaClientes({ clientes }: { clientes: ClienteResumen[] }) {
  return (
    <>
      {/* Móvil: tarjetas */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {clientes.map((cliente) => (
          <li key={cliente.id}>
            <Link
              href={`/clientes/${cliente.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400"
            >
              <span className="block break-words font-medium text-zinc-900">
                {cliente.nombre}
              </span>
              {cliente.empresa ? (
                <span className="block break-words text-sm text-zinc-600">
                  {cliente.empresa}
                </span>
              ) : null}
              {cliente.email ? (
                <span className="mt-2 block break-all text-sm text-zinc-600">
                  {cliente.email}
                </span>
              ) : null}
              {cliente.telefono ? (
                <span className="block text-sm text-zinc-600">
                  {cliente.telefono}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet y escritorio: tabla */}
      <div className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white sm:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Nombre
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Empresa
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Email
              </th>
              <th scope="col" className="w-40 px-4 py-2 font-medium">
                Teléfono
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="break-words font-medium text-zinc-900 hover:underline"
                  >
                    {cliente.nombre}
                  </Link>
                </td>
                <td className="break-words px-4 py-3 text-zinc-700">
                  {cliente.empresa ?? SIN_DATO}
                </td>
                <td className="break-all px-4 py-3 text-zinc-700">
                  {cliente.email ?? SIN_DATO}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {cliente.telefono ?? SIN_DATO}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
