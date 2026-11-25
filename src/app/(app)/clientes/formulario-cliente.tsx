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
import type { Cliente } from "@/lib/tipos";
import {
  type CampoCliente,
  LIMITES_CLIENTE,
} from "@/lib/validacion/cliente";
import { actualizarCliente, crearCliente } from "./actions";

type Props = {
  /** Si llega un cliente, el formulario lo edita; si no, crea uno nuevo. */
  cliente?: Cliente;
};

export function FormularioCliente({ cliente }: Props) {
  const [estado, accion, enviando] = useActionState(
    cliente ? actualizarCliente : crearCliente,
    null,
  );

  const fallo = estado && !estado.ok ? estado : null;

  // Tras un error, el formulario vuelve a mostrar lo que se había escrito.
  const valorInicial = (campo: CampoCliente): string =>
    fallo?.valores?.[campo] ?? cliente?.[campo] ?? "";

  const propsCampo = (campo: CampoCliente) => {
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

  return (
    <form action={accion} className="flex flex-col gap-4" noValidate>
      {cliente ? <input type="hidden" name="id" value={cliente.id} /> : null}

      <Campo campo="nombre" etiqueta="Nombre" obligatorio error={fallo?.errores?.nombre}>
        <input
          {...propsCampo("nombre")}
          type="text"
          autoComplete="off"
          required
          maxLength={LIMITES_CLIENTE.nombre.max}
        />
      </Campo>

      <Campo campo="empresa" etiqueta="Empresa" error={fallo?.errores?.empresa}>
        <input
          {...propsCampo("empresa")}
          type="text"
          autoComplete="off"
          maxLength={LIMITES_CLIENTE.empresa}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo campo="email" etiqueta="Email" error={fallo?.errores?.email}>
          <input
            {...propsCampo("email")}
            type="email"
            inputMode="email"
            autoComplete="off"
            maxLength={LIMITES_CLIENTE.email}
          />
        </Campo>

        <Campo campo="telefono" etiqueta="Teléfono" error={fallo?.errores?.telefono}>
          <input
            {...propsCampo("telefono")}
            type="tel"
            autoComplete="off"
            maxLength={LIMITES_CLIENTE.telefono}
          />
        </Campo>
      </div>

      <Campo campo="notas" etiqueta="Notas" error={fallo?.errores?.notas}>
        <textarea
          {...propsCampo("notas")}
          rows={4}
          maxLength={LIMITES_CLIENTE.notas}
        />
      </Campo>

      {fallo ? (
        <p role="alert" className={AVISO_ERROR}>
          {fallo.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={cliente ? `/clientes/${cliente.id}` : "/clientes"}
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
            : cliente
              ? "Guardar cambios"
              : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}

type PropsCampo = {
  campo: CampoCliente;
  etiqueta: string;
  obligatorio?: boolean;
  error?: string;
  children: ReactNode;
};

function Campo({ campo, etiqueta, obligatorio, error, children }: PropsCampo) {
  return (
    <div className="flex flex-col gap-1.5">
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
      {error ? (
        <p id={`${campo}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
