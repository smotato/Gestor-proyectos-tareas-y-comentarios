import { miembroDeLaRuta } from "@/lib/contexto-proyecto";
import { leerCuerpoJson, manejar } from "@/lib/http";
import { crearInvitacion } from "@/services/invitaciones";

interface Contexto {
  params: Promise<{ id: string }>;
}

/** `POST { rol }` → 201 `{ invitacion }`. Solo el propietario; los demás reciben 403. */
export const POST = manejar(async (request, { params }: Contexto) => {
  const { id } = await params;
  const { proyecto, uid } = await miembroDeLaRuta(request, id);
  const entrada = await leerCuerpoJson(request);
  const invitacion = await crearInvitacion(proyecto, uid, entrada);
  return Response.json({ invitacion }, { status: 201 });
});
