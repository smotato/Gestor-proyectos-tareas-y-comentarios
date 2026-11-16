import { requerirUsuario } from "@/lib/auth";
import { manejar } from "@/lib/http";
import { cargarComoMiembro } from "@/services/proyectos";

interface Contexto {
  params: Promise<{ id: string }>;
}

/** `GET /api/proyectos/:id` → `{ proyecto, rol }`; 404 si no es miembro. */
export const GET = manejar(async (request, { params }: Contexto) => {
  const usuario = await requerirUsuario(request);
  const { id } = await params;
  return Response.json(await cargarComoMiembro(id, usuario.uid, "lector"));
});
