import { CalendarClock, Plus, SquareKanban, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  BOTON_PRIMARIO,
  ENLACE_EN_TEXTO,
  TITULO_PAGINA,
} from "@/components/ui/clases";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { COLORES_ETAPA, PuntoEtapa } from "@/components/ui/etapa";
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
import { SelectorEtapa } from "./selector-etapa";

export const metadata: Metadata = {
  title: "Oportunidades",
};

export default function PaginaOportunidades() {
  return (
    <section className="flex flex-col gap-6">
      <Suspense
        fallback={
          <>
            <h1 className={TITULO_PAGINA}>Oportunidades</h1>
            <p className="text-texto-suave">Cargando…</p>
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
        <h1 className={TITULO_PAGINA}>Oportunidades</h1>
        {hayClientes ? (
          <Link href="/oportunidades/nueva" className={BOTON_PRIMARIO}>
            <Plus aria-hidden="true" className="size-4" />
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
  return hayClientes ? (
    <EstadoVacio icono={SquareKanban} amplio>
      <p className="font-medium text-texto">Todavía no tienes oportunidades.</p>
      <p className="mt-1 text-sm text-texto-suave">
        Pulsa «Nueva oportunidad» para registrar la primera venta en curso de
        uno de tus clientes.
      </p>
      <Link href="/oportunidades/nueva" className={`mt-4 ${BOTON_PRIMARIO}`}>
        <Plus aria-hidden="true" className="size-4" />
        Nueva oportunidad
      </Link>
    </EstadoVacio>
  ) : (
    <EstadoVacio icono={Users} amplio>
      <p className="font-medium text-texto">
        Para crear oportunidades, primero necesitas un cliente.
      </p>
      <p className="mt-1 text-sm text-texto-suave">
        Cada oportunidad de venta pertenece a un cliente. Da de alta el primero
        y vuelve aquí.
      </p>
      <Link href="/clientes/nuevo" className={`mt-4 ${BOTON_PRIMARIO}`}>
        <Plus aria-hidden="true" className="size-4" />
        Nuevo cliente
      </Link>
    </EstadoVacio>
  );
}

/**
 * Una columna por etapa. En el móvil las columnas se apilan y van pasando a
 * 2, 3 y 5 a la vez según el ancho (con la barra lateral, las 5 solo caben
 * desde xl). Nunca hay scroll horizontal.
 */
function Tablero({
  columnas,
}: {
  columnas: ColumnaEmbudo<OportunidadConCliente>[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
      className={`flex min-w-0 flex-col gap-3 rounded-xl border-t-4 bg-superficie-hundida p-2.5 ${COLORES_ETAPA[columna.etapa].borde}`}
    >
      <header className="flex flex-col gap-0.5 px-1 pt-1">
        <h2
          id={idTitulo}
          className="flex items-center justify-between gap-2 font-semibold text-texto"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <PuntoEtapa etapa={columna.etapa} />
            {columna.etiqueta}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COLORES_ETAPA[columna.etapa].etiqueta}`}
          >
            <span className="sr-only">: </span>
            {columna.cantidad}
            <span className="sr-only">
              {columna.cantidad === 1 ? " oportunidad" : " oportunidades"}
            </span>
          </span>
        </h2>
        <p className="break-words text-sm font-medium text-texto-suave">
          <span className="sr-only">Total: </span>
          {formatearEuros(columna.total)}
        </p>
      </header>

      {columna.cantidad === 0 ? (
        <p className="rounded-lg border border-dashed border-borde-fuerte px-3 py-4 text-center text-sm text-texto-suave">
          Ninguna oportunidad en esta etapa.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
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
    <article className="flex min-w-0 flex-col gap-3 rounded-lg border border-borde bg-superficie p-3 shadow-tarjeta transition-shadow hover:border-borde-fuerte hover:shadow-tarjeta-elevada">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="break-words font-medium text-texto">
          <Link
            href={`/oportunidades/${oportunidad.id}/editar`}
            className="rounded-sm hover:text-marca-700 hover:underline"
          >
            <span className="sr-only">Editar </span>
            {oportunidad.titulo}
          </Link>
        </h3>
        {oportunidad.cliente ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar nombre={oportunidad.cliente.nombre} tamano="xs" />
            <Link
              href={`/clientes/${oportunidad.cliente.id}`}
              className={`min-w-0 break-words text-sm text-texto-suave ${ENLACE_EN_TEXTO}`}
            >
              {oportunidad.cliente.nombre}
            </Link>
          </span>
        ) : (
          <span className="text-sm text-texto-tenue">Cliente no disponible</span>
        )}
      </div>
      <p className="break-words text-lg font-semibold tracking-tight text-texto">
        {formatearEuros(importeAEuros(oportunidad.importe))}
      </p>
      <p className="inline-flex items-start gap-1 text-sm text-texto-suave">
        <CalendarClock
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-texto-tenue"
        />
        {oportunidad.fecha_cierre_prevista
          ? `Cierre previsto: ${formatearFecha(oportunidad.fecha_cierre_prevista)}`
          : "Sin fecha de cierre prevista"}
      </p>
      <div className="border-t border-borde pt-3">
        <SelectorEtapa
          id={oportunidad.id}
          titulo={oportunidad.titulo}
          etapa={oportunidad.etapa}
        />
      </div>
    </article>
  );
}
