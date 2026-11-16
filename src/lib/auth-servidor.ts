import { cookies } from "next/headers";
import { connection } from "next/server";
import { type Usuario, usuarioDeCookie } from "./auth";
import { COOKIE_SESION } from "./cookies";

/**
 * Usuario verificado para Server Components.
 *
 * La verificación depende de cada petición: Firebase usa `Date.now()` para
 * revisar la expiración y la revocación. `connection()` detiene el prerender
 * aquí y obliga a que todo lo que sigue corra en la petición real.
 * Quien lo llame debe estar dentro de un <Suspense> con un esqueleto de carga.
 */
export async function usuarioActual(): Promise<Usuario | null> {
  await connection();
  const almacen = await cookies();
  return usuarioDeCookie(almacen.get(COOKIE_SESION)?.value ?? null);
}
