import { Plus, Search, SearchX, Users } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO_CON_ICONO,
  ENLACE,
  ENLACE_EN_TEXTO,
  ETIQUETA_CAMPO,
  TARJETA,
  TITULO_PAGINA,
} from "@/components/ui/clases";
import { EstadoVacio } from "@/components/ui/estado-vacio";
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
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={TITULO_PAGINA}>Clientes</h1>
        <Link href="/clientes/nuevo" className={BOTON_PRIMARIO}>
          <Plus aria-hidden="true" className="size-4" />
          Nuevo cliente
        </Link>
      </div>
      <Suspense fallback={<p className="text-texto-suave">Cargando…</p>}>
        <Listado searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Listado({ searchParams }: Props) {
  const usuario = await requerirUsuario();
  const busqueda = normalizarBusqueda((await searchParams).q);
  const clientes = await listarClientes(busqueda, usuario.id);

  return (
    <div className="flex flex-col gap-4">
      <Buscador busqueda={busqueda} />

      {clientes.length === 0 ? (
        <SinClientes busqueda={busqueda} />
      ) : (
        <>
          <p className="text-sm text-texto-suave">
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
    <Form action="/clientes" className="flex flex-col gap-1.5" role="search">
      <label htmlFor="q" className={ETIQUETA_CAMPO}>
        Buscar por nombre o empresa
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-texto-tenue"
          />
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
            className={CAMPO_CON_ICONO}
          />
        </div>
        <button type="submit" className={`shrink-0 ${BOTON_SECUNDARIO}`}>
          Buscar
        </button>
      </div>
      {busqueda ? (
        <Link href="/clientes" className={`self-start ${ENLACE}`}>
          Quitar la búsqueda
        </Link>
      ) : null}
    </Form>
  );
}

function SinClientes({ busqueda }: { busqueda: string }) {
  return busqueda ? (
    <EstadoVacio icono={SearchX} amplio>
      <p className="font-medium text-texto">
        Ningún cliente coincide con «
        <span className="break-all">{busqueda}</span>».
      </p>
      <p className="mt-1 text-sm text-texto-suave">
        Prueba con otra parte del nombre o de la empresa, o{" "}
        <Link href="/clientes" className={ENLACE_EN_TEXTO}>
          mira todos tus clientes
        </Link>
        .
      </p>
    </EstadoVacio>
  ) : (
    <EstadoVacio icono={Users} amplio>
      <p className="font-medium text-texto">Todavía no tienes clientes.</p>
      <p className="mt-1 text-sm text-texto-suave">
        Pulsa «Nuevo cliente» para dar de alta el primero.
      </p>
      <Link href="/clientes/nuevo" className={`mt-4 ${BOTON_PRIMARIO}`}>
        <Plus aria-hidden="true" className="size-4" />
        Nuevo cliente
      </Link>
    </EstadoVacio>
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
              className={`${TARJETA} flex gap-3 p-4 transition-shadow hover:border-borde-fuerte hover:shadow-tarjeta-elevada`}
            >
              <Avatar nombre={cliente.nombre} />
              <span className="flex min-w-0 flex-col">
                <span className="block break-words font-medium text-texto">
                  {cliente.nombre}
                </span>
                {cliente.empresa ? (
                  <span className="block break-words text-sm text-texto-suave">
                    {cliente.empresa}
                  </span>
                ) : null}
                {cliente.email ? (
                  <span className="mt-2 block break-all text-sm text-texto-suave">
                    {cliente.email}
                  </span>
                ) : null}
                {cliente.telefono ? (
                  <span className="block text-sm text-texto-suave">
                    {cliente.telefono}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet y escritorio: tabla */}
      <div className={`${TARJETA} hidden overflow-hidden sm:block`}>
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-borde bg-fondo text-texto-suave">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Nombre
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Empresa
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Email
              </th>
              <th scope="col" className="w-40 px-4 py-3 font-medium">
                Teléfono
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="transition-colors hover:bg-fondo">
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar nombre={cliente.nombre} tamano="sm" />
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="min-w-0 break-words rounded-sm font-medium text-texto hover:text-marca-700 hover:underline"
                    >
                      {cliente.nombre}
                    </Link>
                  </div>
                </td>
                <td className="break-words px-4 py-3 text-texto-suave">
                  {cliente.empresa ?? SIN_DATO}
                </td>
                <td className="break-all px-4 py-3 text-texto-suave">
                  {cliente.email ?? SIN_DATO}
                </td>
                <td className="px-4 py-3 text-texto-suave">
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
