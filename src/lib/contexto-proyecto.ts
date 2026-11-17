import { cargarComoMiembro } from "@/services/proyectos";
import { requerirUsuario } from "./auth";

/**
 * Sesión y membresía de una ruta `/api/proyectos/:id/**`:
 * 401 sin sesión y 404 si el usuario no es miembro del proyecto.
 */
export async function miembroDeLaRuta(request: Request, proyectoId: string) {
  const usuario = await requerirUsuario(request);
  const { proyecto } = await cargarComoMiembro(
    proyectoId,
    usuario.uid,
    "lector",
  );
  return { proyecto, uid: usuario.uid };
}
