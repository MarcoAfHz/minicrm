"use client";

import { useActionState } from "react";
import {
  AVISO_ERROR,
  BOTON_PRIMARIO,
  CAMPO,
  ETIQUETA_CAMPO,
} from "@/components/ui/clases";
import { iniciarSesion } from "./actions";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, null);

  return (
    <form action={accion} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={ETIQUETA_CAMPO}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={CAMPO}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={ETIQUETA_CAMPO}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={CAMPO}
        />
      </div>

      {estado && !estado.ok ? (
        <p role="alert" className={AVISO_ERROR}>
          {estado.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className={`${BOTON_PRIMARIO} mt-2`}
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
