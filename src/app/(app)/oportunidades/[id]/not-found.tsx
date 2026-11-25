import { FileSearch } from "lucide-react";
import Link from "next/link";
import { BOTON_PRIMARIO } from "@/components/ui/clases";
import { EstadoVacio } from "@/components/ui/estado-vacio";

/** Se muestra si la oportunidad no existe o es de otro usuario. */
export default function OportunidadNoEncontrada() {
  return (
    <EstadoVacio icono={FileSearch} amplio>
      <h1 className="text-lg font-semibold text-texto">
        No hemos encontrado esta oportunidad
      </h1>
      <p className="mt-1 text-sm text-texto-suave">
        Puede que se haya borrado o que el enlace no sea correcto.
      </p>
      <Link href="/oportunidades" className={`mt-4 ${BOTON_PRIMARIO}`}>
        Ver mis oportunidades
      </Link>
    </EstadoVacio>
  );
}
