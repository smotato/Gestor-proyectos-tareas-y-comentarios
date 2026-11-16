import { requerirUsuario } from "@/lib/auth";
import { leerCuerpoJson, manejar } from "@/lib/http";
import {
  actualizarTarea,
  eliminarTarea,
  obtenerTarea,
} from "@/services/gestion-tareas";
import { cargarComoMiembro } from "@/services/proyectos";

interface Contexto {
  params: Promise<{ id: string; tid: string }>;
}

/** Carga el proyecto como miembro (404 si no lo es) y devuelve los ids de la ruta. */
async function entrar(request: Request, contexto: Contexto) {
  const usuario = await requerirUsuario(request);
  const { id, tid } = await contexto.params;
  const { proyecto } = await cargarComoMiembro(id, usuario.uid, "lector");
  return { proyecto, uid: usuario.uid, tid };
}

/** `GET` → `{ tarea }` o 404. */
export const GET = manejar(async (request, contexto: Contexto) => {
  const { proyecto, uid, tid } = await entrar(request, contexto);
  return Response.json({ tarea: await obtenerTarea(proyecto, uid, tid) });
});

/** `PATCH` con cambios parciales → `{ tarea }`. Un lector recibe 403. */
export const PATCH = manejar(async (request, contexto: Contexto) => {
  const { proyecto, uid, tid } = await entrar(request, contexto);
  const cambios = await leerCuerpoJson(request);
  return Response.json({
    tarea: await actualizarTarea(proyecto, uid, tid, cambios),
  });
});

/** `DELETE` → 204. Propietario y editor; un lector recibe 403. */
export const DELETE = manejar(async (request, contexto: Contexto) => {
  const { proyecto, uid, tid } = await entrar(request, contexto);
  await eliminarTarea(proyecto, uid, tid);
  return new Response(null, { status: 204 });
});
