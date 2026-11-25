import {
  CalendarClock,
  type LucideIcon,
  Percent,
  SquareKanban,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  BOTON_PRIMARIO,
  ENLACE,
  ENLACE_EN_TEXTO,
  TARJETA,
  TITULO_PAGINA,
  TITULO_SECCION,
} from "@/components/ui/clases";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { COLORES_ETAPA, EtiquetaEtapa, PuntoEtapa } from "@/components/ui/etapa";
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

export const metadata: Metadata = {
  title: "Panel",
};

export default function PaginaPanel() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className={TITULO_PAGINA}>Panel</h1>
      <Suspense fallback={<p className="text-texto-suave">Cargando…</p>}>
        <Resumen />
      </Suspense>
    </section>
  );
}

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
      <p className="-mt-3 text-texto-suave">
        Hola, <span className="break-all">{usuario.email}</span>. Este es el
        resumen de tus clientes y oportunidades.
      </p>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta
          titulo="En curso"
          icono={TrendingUp}
          tono="marca"
          valor={formatearEuros(metricas.enCurso.total)}
          detalle={formatearCantidad(
            metricas.enCurso.cantidad,
            "oportunidad abierta",
            "oportunidades abiertas",
          )}
        />
        <Tarjeta
          titulo="Ganado este mes"
          icono={Trophy}
          tono="esmeralda"
          valor={formatearEuros(metricas.ganadoEsteMes.total)}
          detalle={`${formatearCantidad(
            metricas.ganadoEsteMes.cantidad,
            "oportunidad ganada",
            "oportunidades ganadas",
          )} en ${formatearMes(ahora)}`}
        />
        <Tarjeta
          titulo="Tasa de éxito"
          icono={Percent}
          tono="ambar"
          valor={formatearPorcentaje(metricas.tasaExito.porcentaje)}
          detalle={detalleTasaExito(metricas.tasaExito)}
        />
        <Tarjeta
          titulo="Clientes"
          icono={Users}
          tono="cielo"
          valor={formatearEntero(metricas.clientes)}
          detalle={
            <Link href="/clientes" className={ENLACE}>
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

/** Color del círculo del icono de cada tarjeta (decorativo). */
const TONOS = {
  marca: "bg-marca-50 text-marca-600",
  esmeralda: "bg-emerald-50 text-emerald-600",
  ambar: "bg-amber-50 text-amber-600",
  cielo: "bg-sky-50 text-sky-600",
} as const;

function Tarjeta({
  titulo,
  icono: Icono,
  tono,
  valor,
  detalle,
}: {
  titulo: string;
  icono: LucideIcon;
  tono: keyof typeof TONOS;
  valor: string;
  detalle: ReactNode;
}) {
  return (
    <div className={`${TARJETA} flex min-w-0 flex-col gap-1 p-5`}>
      <dt className="flex items-center justify-between gap-3 text-sm font-medium text-texto-suave">
        {titulo}
        <span
          aria-hidden="true"
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${TONOS[tono]}`}
        >
          <Icono className="size-5" />
        </span>
      </dt>
      <dd className="break-words text-2xl font-semibold tracking-tight text-texto sm:text-3xl">
        {valor}
      </dd>
      <dd className="text-sm text-texto-suave">{detalle}</dd>
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
        <h2 id="titulo-proximos-cierres" className={TITULO_SECCION}>
          Próximos cierres
        </h2>
        {oportunidades.length > 0 ? (
          <Link href="/oportunidades" className={ENLACE}>
            Ver todas
          </Link>
        ) : null}
      </div>

      {oportunidades.length === 0 ? (
        <SinProximosCierres hayClientes={hayClientes} />
      ) : (
        <ul className={`${TARJETA} divide-y divide-borde`}>
          {oportunidades.map((oportunidad) => (
            <li
              key={oportunidad.id}
              className="flex gap-3 p-4 transition-colors hover:bg-fondo"
            >
              <Avatar nombre={oportunidad.cliente?.nombre ?? ""} />
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <Link
                    href={`/oportunidades/${oportunidad.id}/editar`}
                    className="self-start break-words rounded-sm font-medium text-texto hover:text-marca-700 hover:underline"
                  >
                    <span className="sr-only">Editar </span>
                    {oportunidad.titulo}
                  </Link>
                  {oportunidad.cliente ? (
                    <Link
                      href={`/clientes/${oportunidad.cliente.id}`}
                      className={`max-w-full self-start break-words text-sm text-texto-suave ${ENLACE_EN_TEXTO}`}
                    >
                      {oportunidad.cliente.nombre}
                    </Link>
                  ) : (
                    <span className="text-sm text-texto-tenue">
                      Cliente no disponible
                    </span>
                  )}
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
                    {oportunidad.vencida ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                        Vencida
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="shrink-0 break-words font-semibold text-texto sm:text-right">
                  {formatearEuros(importeAEuros(oportunidad.importe))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SinProximosCierres({ hayClientes }: { hayClientes: boolean }) {
  return (
    <EstadoVacio icono={CalendarClock}>
      <p className="font-medium text-texto">No tienes oportunidades abiertas.</p>
      {hayClientes ? (
        <>
          <p className="mt-1 text-sm text-texto-suave">
            Pulsa «Nueva oportunidad» para registrar una venta en curso y ver
            aquí cuándo está previsto cerrarla.
          </p>
          <Link href="/oportunidades/nueva" className={`mt-4 ${BOTON_PRIMARIO}`}>
            Nueva oportunidad
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-texto-suave">
            Cada oportunidad pertenece a un cliente. Da de alta el primero y
            después crea su oportunidad.
          </p>
          <Link href="/clientes/nuevo" className={`mt-4 ${BOTON_PRIMARIO}`}>
            Nuevo cliente
          </Link>
        </>
      )}
    </EstadoVacio>
  );
}

/**
 * Barras horizontales hechas con CSS, del color de cada etapa. El número y el
 * importe de cada etapa están escritos en texto: la barra es solo un apoyo
 * visual (aria-hidden).
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
      <h2 id="titulo-embudo" className={TITULO_SECCION}>
        Embudo por etapa
      </h2>

      {hayOportunidades ? (
        <ul className={`${TARJETA} flex flex-col gap-5 p-5`}>
          {etapas.map((etapa) => (
            <li key={etapa.etapa} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-texto">
                  <PuntoEtapa etapa={etapa.etapa} />
                  {etapa.etiqueta}
                </span>
                <span className="break-words text-texto-suave">
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
                className="h-2.5 w-full overflow-hidden rounded-full bg-superficie-hundida"
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
        <EstadoVacio icono={SquareKanban}>
          <p className="text-sm text-texto-suave">
            Cuando registres oportunidades, aquí verás cuántas hay en cada etapa
            y cuánto suman.
          </p>
        </EstadoVacio>
      )}
    </section>
  );
}
