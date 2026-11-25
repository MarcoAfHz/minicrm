import { UserX } from "lucide-react";
import Link from "next/link";
import { BOTON_PRIMARIO } from "@/components/ui/clases";
import { EstadoVacio } from "@/components/ui/estado-vacio";

/** Se muestra si el cliente no existe o es de otro usuario. */
export default function ClienteNoEncontrado() {
  return (
    <EstadoVacio icono={UserX} amplio>
      <h1 className="text-lg font-semibold text-texto">
        No hemos encontrado este cliente
      </h1>
      <p className="mt-1 text-sm text-texto-suave">
        Puede que se haya borrado o que el enlace no sea correcto.
      </p>
      <Link href="/clientes" className={`mt-4 ${BOTON_PRIMARIO}`}>
        Ver mis clientes
      </Link>
    </EstadoVacio>
  );
}
