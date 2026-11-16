import { requerirUsuario } from "@/lib/auth";
import { leerCuerpoJson, manejar } from "@/lib/http";
import { cargarComoMiembro } from "@/services/proyectos";
import { crearTarea, listarTareas } from "@/services/gestion-tareas";

interface Contexto {
  params: Promise<{ id: string }>;
}

/** `GET ?estado=&responsable=&mias=1&limite=&cursor=` → `{ items, siguienteCursor }`. */
export const GET = manejar(async (request, { params }: Contexto) => {
  const usuario = await requerirUsuario(request);
  const { id } = await params;
  const { proyecto } = await cargarComoMiembro(id, usuario.uid, "lector");
  const consulta = Object.fromEntries(new URL(request.url).searchParams);
  return Response.json(await listarTareas(proyecto, usuario.uid, consulta));
});

/** `POST` → 201 `{ tarea }`. Un lector recibe 403; el estado inicial es `pendiente`. */
export const POST = manejar(async (request, { params }: Contexto) => {
  const usuario = await requerirUsuario(request);
  const { id } = await params;
  const { proyecto } = await cargarComoMiembro(id, usuario.uid, "lector");
  const tarea = await crearTarea(
    proyecto,
    usuario.uid,
    await leerCuerpoJson(request),
  );
  return Response.json(
    { tarea },
    {
      status: 201,
      headers: { Location: `/api/proyectos/${id}/tareas/${tarea.id}` },
    },
  );
});
