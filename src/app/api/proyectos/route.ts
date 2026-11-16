import { requerirUsuario } from "@/lib/auth";
import { leerCuerpoJson, manejar } from "@/lib/http";
import { crearProyecto, listarMisProyectos } from "@/services/proyectos";

/** `GET /api/proyectos?limite=20&cursor=<id>` → mis proyectos. */
export const GET = manejar(async (request) => {
  const usuario = await requerirUsuario(request);
  const consulta = Object.fromEntries(new URL(request.url).searchParams);
  return Response.json(await listarMisProyectos(usuario.uid, consulta));
});

/** `POST /api/proyectos { nombre }` → 201; quien lo crea es el propietario. */
export const POST = manejar(async (request) => {
  const usuario = await requerirUsuario(request);
  const proyecto = await crearProyecto(
    usuario.uid,
    await leerCuerpoJson(request),
  );
  return Response.json(
    { proyecto },
    { status: 201, headers: { Location: `/api/proyectos/${proyecto.id}` } },
  );
});
