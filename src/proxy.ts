import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { leerConfigSupabase } from "@/lib/supabase/config";

/**
 * Refresca la sesión de Supabase en cada petición y guarda las cookies nuevas.
 * Solo refresca: la protección de las rutas privadas se hace en el servidor,
 * en cada layout y página (D7).
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const configSupabase = leerConfigSupabase();
  if (!configSupabase) {
    return respuesta;
  }

  const supabase = createServerClient(
    configSupabase.url,
    configSupabase.clave,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesNuevas, cabeceras) {
          cookiesNuevas.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          respuesta = NextResponse.next({ request });
          cookiesNuevas.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options),
          );
          Object.entries(cabeceras).forEach(([nombre, valor]) =>
            respuesta.headers.set(nombre, valor),
          );
        },
      },
    },
  );

  try {
    await supabase.auth.getClaims();
  } catch {
    // Si Supabase no responde, se deja pasar la petición sin refrescar.
  }

  return respuesta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
