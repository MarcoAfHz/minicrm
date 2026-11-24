"use client";

import Link from "next/link";
import { type ReactNode, useActionState } from "react";
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

const claseCampo =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 aria-invalid:border-red-600";

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
      className: claseCampo,
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
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {fallo.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={cliente ? `/clientes/${cliente.id}` : "/clientes"}
          className="rounded-md border border-zinc-300 px-4 py-2 text-center font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="flex flex-col gap-1">
      <label htmlFor={campo} className="text-sm font-medium text-zinc-800">
        {etiqueta}
        {obligatorio ? (
          <span className="text-red-700" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="font-normal text-zinc-500"> (opcional)</span>
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
