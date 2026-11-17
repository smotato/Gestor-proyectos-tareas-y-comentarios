import { miembroDeLaRuta } from "@/lib/contexto-proyecto";
import { manejar } from "@/lib/http";
import { listarActividad } from "@/services/gestion-actividad";

interface Contexto {
  params: Promise<{ id: string }>;
}

/** `GET ?limite=20&cursor=<id>` → `{ items, siguienteCursor }`; cualquier miembro. */
export const GET = manejar(async (request, { params }: Contexto) => {
  const { id } = await params;
  const { proyecto, uid } = await miembroDeLaRuta(request, id);
  const consulta = Object.fromEntries(new URL(request.url).searchParams);
  return Response.json(await listarActividad(proyecto, uid, consulta));
});
