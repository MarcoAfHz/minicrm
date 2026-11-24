import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import { importeAEuros } from "@/lib/embudo";
import {
  formatearCantidad,
  formatearEntero,
  formatearEuros,
  formatearFecha,
  formatearMes,
  formatearPorcentaje,
} from "@/lib/format";
import { type EtapaResumen, type TasaExito, metricasPanel } from "@/lib/metricas";
import { requerirUsuario } from "@/lib/supabase/usuario";
import type { OportunidadPanel } from "@/lib/tipos";
import { contarClientes } from "../clientes/datos";
import { listarOportunidadesPanel } from "../oportunidades/datos";
import { COLORES_ETAPA, EtiquetaEtapa } from "../oportunidades/etiqueta-etapa";

export const metadata: Metadata = {
  title: "Panel",
};

export default function PaginaPanel() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Panel</h1>
      <Suspense fallback={<p className="text-zinc-600">Cargando…</p>}>
        <Resumen />
      </Suspense>
    </section>
  );
}

const ESTILO_BOTON =
  "inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700";

const ESTILO_ENLACE = "text-sm text-zinc-700 underline hover:text-zinc-950";

async function Resumen() {
  const usuario = await requerirUsuario();
  const [oportunidades, clientes] = await Promise.all([
    listarOportunidadesPanel(usuario.id),
    contarClientes(usuario.id),
  ]);
  // "Ahora" tiene que ser la hora real de la visita, no la de un prerender.
  // Con Cache Components, leer la hora (new Date()) mientras Next prerenderiza
  // da error aunque antes se hayan leído las cookies; connection() deja todo
  // lo que sigue para la petición real. (crearSupabaseServidor ya lo llama,
  // pero aquí queda explícito junto a la lectura de la hora.)
  await connection();
  const ahora = new Date();
  const metricas = metricasPanel(oportunidades, clientes, ahora);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-zinc-600">
        Hola, <span className="break-all">{usuario.email}</span>. Este es el
        resumen de tus clientes y oportunidades.
      </p>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta
          titulo="En curso"
          valor={formatearEuros(metricas.enCurso.total)}
          detalle={formatearCantidad(
            metricas.enCurso.cantidad,
            "oportunidad abierta",
            "oportunidades abiertas",
          )}
        />
        <Tarjeta
          titulo="Ganado este mes"
          valor={formatearEuros(metricas.ganadoEsteMes.total)}
          detalle={`${formatearCantidad(
            metricas.ganadoEsteMes.cantidad,
            "oportunidad ganada",
            "oportunidades ganadas",
          )} en ${formatearMes(ahora)}`}
        />
        <Tarjeta
          titulo="Tasa de éxito"
          valor={formatearPorcentaje(metricas.tasaExito.porcentaje)}
          detalle={detalleTasaExito(metricas.tasaExito)}
        />
        <Tarjeta
          titulo="Clientes"
          valor={formatearEntero(metricas.clientes)}
          detalle={
            <Link href="/clientes" className={ESTILO_ENLACE}>
              Ver clientes
            </Link>
          }
        />
      </dl>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <ProximosCierres
          oportunidades={metricas.proximosCierres}
          hayClientes={metricas.clientes > 0}
        />
        <ResumenEmbudo
          etapas={metricas.embudo}
          hayOportunidades={oportunidades.length > 0}
        />
      </div>
    </div>
  );
}

function detalleTasaExito({ ganadas, perdidas, porcentaje }: TasaExito): string {
  if (porcentaje === null) {
    return "Aún no hay oportunidades ganadas ni perdidas";
  }
  return `${formatearCantidad(ganadas, "ganada", "ganadas")} de ${formatearCantidad(
    ganadas + perdidas,
    "cerrada",
    "cerradas",
  )}`;
}

function Tarjeta({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: string;
  detalle: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4">
      <dt className="text-sm font-medium text-zinc-600">{titulo}</dt>
      <dd className="break-words text-2xl font-semibold text-zinc-900">
        {valor}
      </dd>
      <dd className="text-sm text-zinc-600">{detalle}</dd>
    </div>
  );
}

function ProximosCierres({
  oportunidades,
  hayClientes,
}: {
  oportunidades: (OportunidadPanel & { vencida: boolean })[];
  hayClientes: boolean;
}) {
  return (
    <section
      aria-labelledby="titulo-proximos-cierres"
      className="flex min-w-0 flex-col gap-3 lg:col-span-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="titulo-proximos-cierres"
          className="text-lg font-semibold text-zinc-900"
        >
          Próximos cierres
        </h2>
        {oportunidades.length > 0 ? (
          <Link href="/oportunidades" className={ESTILO_ENLACE}>
            Ver todas
          </Link>
        ) : null}
      </div>

      {oportunidades.length === 0 ? (
        <SinProximosCierres hayClientes={hayClientes} />
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {oportunidades.map((oportunidad) => (
            <li
              key={oportunidad.id}
              className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`/oportunidades/${oportunidad.id}/editar`}
                  className="break-words font-medium text-zinc-900 hover:underline"
                >
                  <span className="sr-only">Editar </span>
                  {oportunidad.titulo}
                </Link>
                {oportunidad.cliente ? (
                  <Link
                    href={`/clientes/${oportunidad.cliente.id}`}
                    className="max-w-full self-start break-words text-sm text-zinc-600 underline hover:text-zinc-950"
                  >
                    {oportunidad.cliente.nombre}
                  </Link>
                ) : (
                  <span className="text-sm text-zinc-500">
                    Cliente no disponible
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
                  <EtiquetaEtapa etapa={oportunidad.etapa} />
                  <span>
                    {oportunidad.fecha_cierre_prevista
                      ? `Cierre previsto: ${formatearFecha(oportunidad.fecha_cierre_prevista)}`
                      : "Sin fecha de cierre prevista"}
                  </span>
                  {oportunidad.vencida ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      Vencida
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="shrink-0 break-words font-semibold text-zinc-900 sm:text-right">
                {formatearEuros(importeAEuros(oportunidad.importe))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SinProximosCierres({ hayClientes }: { hayClientes: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center">
      <p className="font-medium text-zinc-900">
        No tienes oportunidades abiertas.
      </p>
      {hayClientes ? (
        <>
          <p className="mt-1 text-sm text-zinc-600">
            Pulsa «Nueva oportunidad» para registrar una venta en curso y ver
            aquí cuándo está previsto cerrarla.
          </p>
          <Link href="/oportunidades/nueva" className={`mt-4 ${ESTILO_BOTON}`}>
            Nueva oportunidad
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-600">
            Cada oportunidad pertenece a un cliente. Da de alta el primero y
            después crea su oportunidad.
          </p>
          <Link href="/clientes/nuevo" className={`mt-4 ${ESTILO_BOTON}`}>
            Nuevo cliente
          </Link>
        </>
      )}
    </div>
  );
}

/**
 * Barras horizontales hechas con CSS. El número y el importe de cada etapa
 * están escritos en texto: la barra es solo un apoyo visual (aria-hidden).
 */
function ResumenEmbudo({
  etapas,
  hayOportunidades,
}: {
  etapas: EtapaResumen[];
  hayOportunidades: boolean;
}) {
  return (
    <section
      aria-labelledby="titulo-embudo"
      className="flex min-w-0 flex-col gap-3 lg:col-span-2"
    >
      <h2 id="titulo-embudo" className="text-lg font-semibold text-zinc-900">
        Embudo por etapa
      </h2>

      {hayOportunidades ? (
        <ul className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4">
          {etapas.map((etapa) => (
            <li key={etapa.etapa} className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="font-medium text-zinc-900">
                  {etapa.etiqueta}
                </span>
                <span className="break-words text-zinc-600">
                  {formatearCantidad(
                    etapa.cantidad,
                    "oportunidad",
                    "oportunidades",
                  )}{" "}
                  · {formatearEuros(etapa.total)}
                </span>
              </div>
              <div
                aria-hidden="true"
                className="h-2 w-full overflow-hidden rounded-full bg-zinc-100"
              >
                <div
                  className={`h-full rounded-full ${COLORES_ETAPA[etapa.etapa].barra}`}
                  style={{ width: `${etapa.ancho}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center">
          <p className="text-sm text-zinc-600">
            Cuando registres oportunidades, aquí verás cuántas hay en cada etapa
            y cuánto suman.
          </p>
        </div>
      )}
    </section>
  );
}
