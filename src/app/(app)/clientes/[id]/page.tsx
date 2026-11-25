import {
  Building,
  CalendarDays,
  CalendarClock,
  type LucideIcon,
  Mail,
  NotebookText,
  Pencil,
  Phone,
  Plus,
  SquareKanban,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  BOTON_PRIMARIO,
  ENLACE_EN_TEXTO,
  ENLACE_VOLVER,
  TARJETA,
  TITULO_PAGINA,
  TITULO_SECCION,
} from "@/components/ui/clases";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { EtiquetaEtapa } from "@/components/ui/etapa";
import { importeAEuros, sumarEnCurso, sumarGanado } from "@/lib/embudo";
import { formatearEuros, formatearFecha } from "@/lib/format";
import { requerirUsuario } from "@/lib/supabase/usuario";
import type { Cliente, OportunidadResumen } from "@/lib/tipos";
import { listarOportunidadesDeCliente } from "../../oportunidades/datos";
import { BotonBorrarCliente } from "../boton-borrar-cliente";
import { obtenerCliente } from "../datos";

export const metadata: Metadata = {
  title: "Ficha de cliente",
};

type Props = { params: Promise<{ id: string }> };

export default function PaginaCliente({ params }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <Link href="/clientes" className={ENLACE_VOLVER}>
        ← Volver a clientes
      </Link>
      <Suspense fallback={<p className="text-texto-suave">Cargando…</p>}>
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
      <div
        className={`${TARJETA} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <Avatar nombre={cliente.nombre} tamano="lg" />
          <div className="min-w-0">
            <h1 className={`break-words ${TITULO_PAGINA}`}>{cliente.nombre}</h1>
            {cliente.empresa ? (
              <p className="break-words text-texto-suave">{cliente.empresa}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <Link href={`/clientes/${cliente.id}/editar`} className={BOTON_PRIMARIO}>
            <Pencil aria-hidden="true" className="size-4" />
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
        <h2 id="titulo-oportunidades" className={TITULO_SECCION}>
          Oportunidades
        </h2>
        {oportunidades.length > 0 ? (
          <Link href={rutaNueva} className={BOTON_PRIMARIO}>
            <Plus aria-hidden="true" className="size-4" />
            Nueva oportunidad
          </Link>
        ) : null}
      </div>

      {oportunidades.length > 0 ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1">
            <dt className="text-texto-suave">En curso:</dt>
            <dd className="font-semibold text-texto">
              {formatearEuros(sumarEnCurso(oportunidades))}
            </dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-texto-suave">Ganado:</dt>
            <dd className="font-semibold text-etapa-ganada-texto">
              {formatearEuros(sumarGanado(oportunidades))}
            </dd>
          </div>
        </dl>
      ) : null}

      {oportunidades.length === 0 ? (
        <EstadoVacio icono={SquareKanban}>
          <p className="font-medium text-texto">
            Este cliente aún no tiene oportunidades.
          </p>
          <p className="mt-1 text-sm text-texto-suave">
            Pulsa «Nueva oportunidad» para registrar una venta en curso con
            este cliente.
          </p>
          <Link href={rutaNueva} className={`mt-4 ${BOTON_PRIMARIO}`}>
            <Plus aria-hidden="true" className="size-4" />
            Nueva oportunidad
          </Link>
        </EstadoVacio>
      ) : (
        <ul className={`${TARJETA} divide-y divide-borde`}>
          {oportunidades.map((oportunidad) => (
            <li
              key={oportunidad.id}
              className="flex flex-col gap-1 p-4 transition-colors hover:bg-fondo sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`/oportunidades/${oportunidad.id}/editar?volver=cliente`}
                  className="self-start break-words rounded-sm font-medium text-texto hover:text-marca-700 hover:underline"
                >
                  <span className="sr-only">Editar </span>
                  {oportunidad.titulo}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-suave">
                  <EtiquetaEtapa etapa={oportunidad.etapa} />
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock
                      aria-hidden="true"
                      className="size-4 shrink-0 text-texto-tenue"
                    />
                    {oportunidad.fecha_cierre_prevista
                      ? `Cierre previsto: ${formatearFecha(oportunidad.fecha_cierre_prevista)}`
                      : "Sin fecha de cierre prevista"}
                  </span>
                </div>
              </div>
              <p className="shrink-0 font-semibold text-texto sm:text-right">
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
    <dl className={`${TARJETA} grid gap-5 p-4 sm:grid-cols-2 sm:p-6`}>
      <Dato etiqueta="Email" icono={Mail}>
        {cliente.email ? (
          <a
            href={`mailto:${cliente.email}`}
            className={`break-all ${ENLACE_EN_TEXTO}`}
          >
            {cliente.email}
          </a>
        ) : null}
      </Dato>
      <Dato etiqueta="Teléfono" icono={Phone}>
        {cliente.telefono ? (
          <a
            href={`tel:${cliente.telefono.replace(/[^0-9+]/g, "")}`}
            className={ENLACE_EN_TEXTO}
          >
            {cliente.telefono}
          </a>
        ) : null}
      </Dato>
      <Dato etiqueta="Empresa" icono={Building}>
        {cliente.empresa}
      </Dato>
      <Dato etiqueta="Cliente desde" icono={CalendarDays}>
        {formatearFecha(cliente.created_at)}
      </Dato>
      <Dato etiqueta="Notas" icono={NotebookText} className="sm:col-span-2">
        {cliente.notas ? (
          <span className="whitespace-pre-line">{cliente.notas}</span>
        ) : null}
      </Dato>
    </dl>
  );
}

function Dato({
  etiqueta,
  icono: Icono,
  className = "",
  children,
}: {
  etiqueta: string;
  icono: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <dt className="inline-flex items-center gap-1.5 text-sm text-texto-tenue">
        <Icono aria-hidden="true" className="size-4 shrink-0" />
        {etiqueta}
      </dt>
      <dd className="break-words pl-5.5 text-texto">
        {children ?? <span className="text-texto-tenue">Sin indicar</span>}
      </dd>
    </div>
  );
}
