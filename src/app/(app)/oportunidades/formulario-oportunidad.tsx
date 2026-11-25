"use client";

import Link from "next/link";
import { type ReactNode, useActionState } from "react";
import {
  AVISO_ERROR,
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO,
  ETIQUETA_CAMPO,
} from "@/components/ui/clases";
import { ETAPAS, ETIQUETAS_ETAPA } from "@/lib/embudo";
import type { ClienteOpcion, Oportunidad } from "@/lib/tipos";
import {
  type CampoOportunidad,
  LIMITES_OPORTUNIDAD,
  importeATexto,
} from "@/lib/validacion/oportunidad";
import { actualizarOportunidad, crearOportunidad } from "./actions";

type Props = {
  /** Clientes del usuario para el desplegable. */
  clientes: ClienteOpcion[];
  /** Si llega una oportunidad, el formulario la edita; si no, crea una nueva. */
  oportunidad?: Oportunidad;
  /** Cliente elegido de entrada al crear (cuando se viene de su ficha). */
  clienteInicial?: string;
  /** Si es cierto, al guardar o cancelar se vuelve a la ficha del cliente. */
  volver?: boolean;
};

export function FormularioOportunidad({
  clientes,
  oportunidad,
  clienteInicial,
  volver = false,
}: Props) {
  const [estado, accion, enviando] = useActionState(
    oportunidad ? actualizarOportunidad : crearOportunidad,
    null,
  );

  const fallo = estado && !estado.ok ? estado : null;

  const valorGuardado = (campo: CampoOportunidad): string => {
    switch (campo) {
      case "cliente_id":
        return oportunidad?.cliente_id ?? clienteInicial ?? "";
      case "titulo":
        return oportunidad?.titulo ?? "";
      case "importe":
        return oportunidad ? importeATexto(oportunidad.importe) : "";
      case "etapa":
        return oportunidad?.etapa ?? "nuevo";
      case "fecha_cierre_prevista":
        return oportunidad?.fecha_cierre_prevista ?? "";
    }
  };

  // Tras un error, el formulario vuelve a mostrar lo que se había escrito.
  const valorInicial = (campo: CampoOportunidad): string =>
    fallo?.valores?.[campo] ?? valorGuardado(campo);

  const propsCampo = (campo: CampoOportunidad) => {
    const error = fallo?.errores?.[campo];
    return {
      id: campo,
      name: campo,
      defaultValue: valorInicial(campo),
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${campo}-error` : undefined,
      className: CAMPO,
    };
  };

  const clienteVuelta = oportunidad?.cliente_id ?? clienteInicial;
  const rutaCancelar =
    volver && clienteVuelta ? `/clientes/${clienteVuelta}` : "/oportunidades";

  return (
    <form action={accion} className="flex flex-col gap-4" noValidate>
      {oportunidad ? (
        <input type="hidden" name="id" value={oportunidad.id} />
      ) : null}
      {volver ? <input type="hidden" name="volver" value="cliente" /> : null}

      <Campo
        campo="cliente_id"
        etiqueta="Cliente"
        obligatorio
        error={fallo?.errores?.cliente_id}
      >
        {/* React no aplica un defaultValue nuevo a un <select> ya montado: la
            key lo vuelve a crear para mostrar lo elegido tras un error. */}
        <select
          key={valorInicial("cliente_id")}
          {...propsCampo("cliente_id")}
          required
        >
          <option value="">Elige un cliente…</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.empresa
                ? `${cliente.nombre} (${cliente.empresa})`
                : cliente.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo
        campo="titulo"
        etiqueta="Título"
        obligatorio
        error={fallo?.errores?.titulo}
      >
        <input
          {...propsCampo("titulo")}
          type="text"
          autoComplete="off"
          required
          maxLength={LIMITES_OPORTUNIDAD.titulo.max}
          placeholder="Ej.: Renovación de licencias"
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          campo="importe"
          etiqueta="Importe (€)"
          ayuda="Usa la coma para los decimales. Ej.: 1.234,56 €. Vacío cuenta como 0."
          error={fallo?.errores?.importe}
        >
          <input
            {...propsCampo("importe")}
            aria-describedby={
              fallo?.errores?.importe
                ? "importe-ayuda importe-error"
                : "importe-ayuda"
            }
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
          />
        </Campo>

        <Campo
          campo="etapa"
          etiqueta="Etapa"
          obligatorio
          error={fallo?.errores?.etapa}
        >
          <select key={valorInicial("etapa")} {...propsCampo("etapa")} required>
            {ETAPAS.map((etapa) => (
              <option key={etapa} value={etapa}>
                {ETIQUETAS_ETAPA[etapa]}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          campo="fecha_cierre_prevista"
          etiqueta="Cierre previsto"
          error={fallo?.errores?.fecha_cierre_prevista}
        >
          <input {...propsCampo("fecha_cierre_prevista")} type="date" />
        </Campo>
      </div>

      {fallo ? (
        <p role="alert" className={AVISO_ERROR}>
          {fallo.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={rutaCancelar}
          className={BOTON_SECUNDARIO}
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className={BOTON_PRIMARIO}
        >
          {enviando
            ? "Guardando…"
            : oportunidad
              ? "Guardar cambios"
              : "Crear oportunidad"}
        </button>
      </div>
    </form>
  );
}

type PropsCampo = {
  campo: CampoOportunidad;
  etiqueta: string;
  obligatorio?: boolean;
  ayuda?: string;
  error?: string;
  children: ReactNode;
};

function Campo({
  campo,
  etiqueta,
  obligatorio,
  ayuda,
  error,
  children,
}: PropsCampo) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={campo} className={ETIQUETA_CAMPO}>
        {etiqueta}
        {obligatorio ? (
          <span className="text-red-700" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="font-normal text-texto-tenue"> (opcional)</span>
        )}
      </label>
      {children}
      {ayuda ? (
        <p id={`${campo}-ayuda`} className="text-xs text-texto-tenue">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={`${campo}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
