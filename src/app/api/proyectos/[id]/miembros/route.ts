import { requerirUsuario } from "@/lib/auth";
import { manejar } from "@/lib/http";
import { listarMiembros } from "@/services/proyectos";

interface Contexto {
  params: Promise<{ id: string }>;
}

/** `GET /api/proyectos/:id/miembros` → `{ rol, items: [{ uid, rol, correo }] }`. */
export const GET = manejar(async (request, { params }: Contexto) => {
  const usuario = await requerirUsuario(request);
  const { id } = await params;
  return Response.json(await listarMiembros(id, usuario.uid));
});
