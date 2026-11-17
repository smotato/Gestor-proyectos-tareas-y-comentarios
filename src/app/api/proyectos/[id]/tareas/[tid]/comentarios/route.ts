import { miembroDeLaRuta } from "@/lib/contexto-proyecto";
import { leerCuerpoJson, manejar } from "@/lib/http";
import {
  crearComentario,
  listarComentarios,
} from "@/services/gestion-comentarios";

interface Contexto {
  params: Promise<{ id: string; tid: string }>;
}

/** `GET ?limite=20&cursor=<id>` → `{ items, siguienteCursor }`; 404 si no hay tarea. */
export const GET = manejar(async (request, { params }: Contexto) => {
  const { id, tid } = await params;
  const { proyecto, uid } = await miembroDeLaRuta(request, id);
  const consulta = Object.fromEntries(new URL(request.url).searchParams);
  return Response.json(await listarComentarios(proyecto, uid, tid, consulta));
});

/** `POST { texto }` → 201 `{ comentario }`. Un lector recibe 403. */
export const POST = manejar(async (request, { params }: Contexto) => {
  const { id, tid } = await params;
  const { proyecto, uid } = await miembroDeLaRuta(request, id);
  const entrada = await leerCuerpoJson(request);
  const comentario = await crearComentario(proyecto, uid, tid, entrada);
  return Response.json({ comentario }, { status: 201 });
});
