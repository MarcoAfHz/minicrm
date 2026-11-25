import { type ColorAvatar, colorAvatar, iniciales } from "@/lib/avatar";

const COLORES: Record<ColorAvatar, string> = {
  indigo: "bg-indigo-100 text-indigo-800",
  sky: "bg-sky-100 text-sky-800",
  violet: "bg-violet-100 text-violet-800",
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800",
  rose: "bg-rose-100 text-rose-800",
  teal: "bg-teal-100 text-teal-800",
  fuchsia: "bg-fuchsia-100 text-fuchsia-800",
};

const TAMANOS = {
  xs: "size-6 text-[0.625rem]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
} as const;

type Props = {
  /** Nombre del que salen las iniciales y el color. */
  nombre: string;
  /** Iniciales ya calculadas (por ejemplo, las de un email). */
  texto?: string;
  tamano?: keyof typeof TAMANOS;
};

/**
 * Círculo con las iniciales. Es decorativo (el nombre ya está escrito al lado),
 * así que los lectores de pantalla lo saltan.
 */
export function Avatar({ nombre, texto, tamano = "md" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${TAMANOS[tamano]} ${COLORES[colorAvatar(nombre)]}`}
    >
      {texto ?? iniciales(nombre)}
    </span>
  );
}
