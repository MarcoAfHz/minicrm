import Link from "next/link";
import { BotonSalir } from "./boton-salir";

const enlaces = [
  { href: "/panel", texto: "Panel" },
  { href: "/clientes", texto: "Clientes" },
  { href: "/oportunidades", texto: "Oportunidades" },
] as const;

export function Cabecera({ email }: { email: string }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/panel" className="text-lg font-semibold text-zinc-900">
          Mini CRM
        </Link>

        <nav
          aria-label="Principal"
          className="order-last w-full sm:order-none sm:w-auto sm:flex-1"
        >
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {enlaces.map((enlace) => (
              <li key={enlace.href}>
                <Link
                  href={enlace.href}
                  className="font-medium text-zinc-700 hover:text-zinc-950 hover:underline"
                >
                  {enlace.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 items-center gap-3">
          <span
            className="max-w-[40vw] truncate text-sm text-zinc-600 sm:max-w-xs"
            title={email}
          >
            {email}
          </span>
          <BotonSalir />
        </div>
      </div>
    </header>
  );
}
