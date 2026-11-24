import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { importeAEuros, sumarEnCurso, sumarGanado } from "@/lib/embudo";
import { formatearEuros, formatearFecha } from "@/lib/format";
import { requerirUsuario } from "@/lib/supabase/usuario";
import type { Cliente, OportunidadResumen } from "@/lib/tipos";
import { listarOportunidadesDeCliente } from "../../oportunidades/datos";
import { EtiquetaEtapa } from "../../oportunidades/etiqueta-etapa";
import { BotonBorrarCliente } from "../boton-borrar-cliente";
import { obtenerCliente } from "../datos";

export const metadata: Metadata = {
  title: "Ficha de cliente",
};

type Props = { params: Promise<{ id: string }> };

export default function PaginaCliente({ params }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <Link
        href="/clientes"
        className="self-start text-sm text-zinc-700 hover:text-zinc-950 hover:underline"
      >
        ← Volver a clientes
      </Link>
      <Suspense fallback={<p className="text-zinc-600">Cargando…</p>}>
        <Ficha params={params} />
      </Suspense>
    </section>
  );
}

async function Ficha({ params }: Props) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const [cliente, oportunidades] = await Promise.all([
    obtenerCliente(id, usuario.id),
    listarOportunidadesDeCliente(id, usuario.id),
  ]);
  if (!cliente) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-zinc-900">
            {cliente.nombre}
          </h1>
          {cliente.empresa ? (
            <p className="break-words text-zinc-600">{cliente.empresa}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/clientes/${cliente.id}/editar`}
            className="rounded-md bg-zinc-900 px-4 py-2 text-center font-medium text-white hover:bg-zinc-700"
          >
            Editar
          </Link>
          <BotonBorrarCliente id={cliente.id} nombre={cliente.nombre} />
        </div>
      </div>

      <DatosCliente cliente={cliente} />

      <OportunidadesCliente
        clienteId={cliente.id}
        oportunidades={oportunidades}
      />
    </div>
  );
}

function OportunidadesCliente({
  clienteId,
  oportunidades,
}: {
  clienteId: string;
  oportunidades: OportunidadResumen[];
}) {
  const rutaNueva = `/oportunidades/nueva?cliente=${clienteId}`;

  return (
    <section
      aria-labelledby="titulo-oportunidades"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="titulo-oportunidades"
          className="text-lg font-semibold text-zinc-900"
        >
          Oportunidades
        </h2>
        {oportunidades.length > 0 ? (
          <Link
            href={rutaNueva}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Nueva oportunidad
          </Link>
        ) : null}
      </div>

      {oportunidades.length > 0 ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1">
            <dt className="text-zinc-600">En curso:</dt>
            <dd className="font-semibold text-zinc-900">
              {formatearEuros(sumarEnCurso(oportunidades))}
            </dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-zinc-600">Ganado:</dt>
            <dd className="font-semibold text-zinc-900">
              {formatearEuros(sumarGanado(oportunidades))}
            </dd>
          </div>
        </dl>
      ) : null}

      {oportunidades.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center">
          <p className="font-medium text-zinc-900">
            Este cliente aún no tiene oportunidades.
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Pulsa «Nueva oportunidad» para registrar una venta en curso con
            este cliente.
          </p>
          <Link
            href={rutaNueva}
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Nueva oportunidad
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {oportunidades.map((oportunidad) => (
            <li
              key={oportunidad.id}
              className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`/oportunidades/${oportunidad.id}/editar?volver=cliente`}
                  className="break-words font-medium text-zinc-900 hover:underline"
                >
                  <span className="sr-only">Editar </span>
                  {oportunidad.titulo}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
                  <EtiquetaEtapa etapa={oportunidad.etapa} />
                  <span>
                    {oportunidad.fecha_cierre_prevista
                      ? `Cierre previsto: ${formatearFecha(oportunidad.fecha_cierre_prevista)}`
                      : "Sin fecha de cierre prevista"}
                  </span>
                </div>
              </div>
              <p className="shrink-0 font-semibold text-zinc-900 sm:text-right">
                {formatearEuros(importeAEuros(oportunidad.importe))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DatosCliente({ cliente }: { cliente: Cliente }) {
  return (
    <dl className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 sm:p-6">
      <Dato etiqueta="Email">
        {cliente.email ? (
          <a
            href={`mailto:${cliente.email}`}
            className="break-all text-zinc-900 underline hover:text-zinc-700"
          >
            {cliente.email}
          </a>
        ) : null}
      </Dato>
      <Dato etiqueta="Teléfono">
        {cliente.telefono ? (
          <a
            href={`tel:${cliente.telefono.replace(/[^0-9+]/g, "")}`}
            className="text-zinc-900 underline hover:text-zinc-700"
          >
            {cliente.telefono}
          </a>
        ) : null}
      </Dato>
      <Dato etiqueta="Empresa">{cliente.empresa}</Dato>
      <Dato etiqueta="Cliente desde">{formatearFecha(cliente.created_at)}</Dato>
      <Dato etiqueta="Notas" className="sm:col-span-2">
        {cliente.notas ? (
          <span className="whitespace-pre-line">{cliente.notas}</span>
        ) : null}
      </Dato>
    </dl>
  );
}

function Dato({
  etiqueta,
  className = "",
  children,
}: {
  etiqueta: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-0.5 ${className}`}>
      <dt className="text-sm text-zinc-500">{etiqueta}</dt>
      <dd className="break-words text-zinc-900">
        {children ?? <span className="text-zinc-500">Sin indicar</span>}
      </dd>
    </div>
  );
}
