import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  type ColumnaEmbudo,
  columnasEmbudo,
  importeAEuros,
} from "@/lib/embudo";
import { formatearEuros, formatearFecha } from "@/lib/format";
import { requerirUsuario } from "@/lib/supabase/usuario";
import type { OportunidadConCliente } from "@/lib/tipos";
import { tieneClientes } from "../clientes/datos";
import { listarOportunidades } from "./datos";
import { COLORES_ETAPA } from "./etiqueta-etapa";
import { SelectorEtapa } from "./selector-etapa";

export const metadata: Metadata = {
  title: "Oportunidades",
};

export default function PaginaOportunidades() {
  return (
    <section className="flex flex-col gap-4">
      <Suspense
        fallback={
          <>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Oportunidades
            </h1>
            <p className="text-zinc-600">Cargando…</p>
          </>
        }
      >
        <Embudo />
      </Suspense>
    </section>
  );
}

async function Embudo() {
  const usuario = await requerirUsuario();
  const [oportunidades, hayClientes] = await Promise.all([
    listarOportunidades(usuario.id),
    tieneClientes(usuario.id),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">Oportunidades</h1>
        {hayClientes ? (
          <Link
            href="/oportunidades/nueva"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Nueva oportunidad
          </Link>
        ) : null}
      </div>

      {oportunidades.length === 0 ? (
        <SinOportunidades hayClientes={hayClientes} />
      ) : (
        <Tablero columnas={columnasEmbudo(oportunidades)} />
      )}
    </>
  );
}

function SinOportunidades({ hayClientes }: { hayClientes: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
      {hayClientes ? (
        <>
          <p className="font-medium text-zinc-900">
            Todavía no tienes oportunidades.
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Pulsa «Nueva oportunidad» para registrar la primera venta en curso
            de uno de tus clientes.
          </p>
          <Link
            href="/oportunidades/nueva"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Nueva oportunidad
          </Link>
        </>
      ) : (
        <>
          <p className="font-medium text-zinc-900">
            Para crear oportunidades, primero necesitas un cliente.
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Cada oportunidad de venta pertenece a un cliente. Da de alta el
            primero y vuelve aquí.
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

/**
 * Una columna por etapa. En el móvil las columnas se apilan; en pantallas
 * anchas se ven las 5 a la vez. Nunca hay scroll horizontal.
 */
function Tablero({
  columnas,
}: {
  columnas: ColumnaEmbudo<OportunidadConCliente>[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
      {columnas.map((columna) => (
        <Columna key={columna.etapa} columna={columna} />
      ))}
    </div>
  );
}

function Columna({
  columna,
}: {
  columna: ColumnaEmbudo<OportunidadConCliente>;
}) {
  const idTitulo = `columna-${columna.etapa}`;

  return (
    <section
      aria-labelledby={idTitulo}
      className={`flex min-w-0 flex-col gap-2 rounded-lg border-t-4 bg-zinc-100 p-2 ${COLORES_ETAPA[columna.etapa].borde}`}
    >
      <header className="flex flex-col px-1 pt-1">
        <h2
          id={idTitulo}
          className="flex items-center justify-between gap-2 font-semibold text-zinc-900"
        >
          {columna.etiqueta}
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-700">
            <span className="sr-only">: </span>
            {columna.cantidad}
            <span className="sr-only">
              {columna.cantidad === 1 ? " oportunidad" : " oportunidades"}
            </span>
          </span>
        </h2>
        <p className="break-words text-sm text-zinc-600">
          <span className="sr-only">Total: </span>
          {formatearEuros(columna.total)}
        </p>
      </header>

      {columna.cantidad === 0 ? (
        <p className="px-1 py-3 text-sm text-zinc-500">
          Ninguna oportunidad en esta etapa.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {columna.oportunidades.map((oportunidad) => (
            <li key={oportunidad.id}>
              <Tarjeta oportunidad={oportunidad} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Tarjeta({ oportunidad }: { oportunidad: OportunidadConCliente }) {
  return (
    <article className="flex min-w-0 flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="break-words font-medium text-zinc-900">
          <Link
            href={`/oportunidades/${oportunidad.id}/editar`}
            className="hover:underline"
          >
            <span className="sr-only">Editar </span>
            {oportunidad.titulo}
          </Link>
        </h3>
        {oportunidad.cliente ? (
          <Link
            href={`/clientes/${oportunidad.cliente.id}`}
            className="max-w-full self-start break-words text-sm text-zinc-600 underline hover:text-zinc-950"
          >
            {oportunidad.cliente.nombre}
          </Link>
        ) : (
          <span className="text-sm text-zinc-500">Cliente no disponible</span>
        )}
      </div>
      <p className="break-words font-semibold text-zinc-900">
        {formatearEuros(importeAEuros(oportunidad.importe))}
      </p>
      <p className="text-sm text-zinc-600">
        {oportunidad.fecha_cierre_prevista
          ? `Cierre previsto: ${formatearFecha(oportunidad.fecha_cierre_prevista)}`
          : "Sin fecha de cierre prevista"}
      </p>
      <SelectorEtapa
        id={oportunidad.id}
        titulo={oportunidad.titulo}
        etapa={oportunidad.etapa}
      />
    </article>
  );
}
