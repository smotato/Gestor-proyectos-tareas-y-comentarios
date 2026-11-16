import { requerirUsuario } from "@/lib/auth";
import { leerCuerpoJson, manejar } from "@/lib/http";
import { cambiarRolMiembro, quitarMiembro } from "@/services/proyectos";

interface Contexto {
  params: Promise<{ id: string; uid: string }>;
}

/** `PATCH { rol }` → solo el propietario; 409 si dejaría el proyecto sin propietario. */
export const PATCH = manejar(async (request, { params }: Contexto) => {
  const usuario = await requerirUsuario(request);
  const { id, uid } = await params;
  const proyecto = await cambiarRolMiembro(
    usuario.uid,
    id,
    uid,
    await leerCuerpoJson(request),
  );
  return Response.json({ proyecto });
});

/** `DELETE` → 204; solo el propietario y nunca al último propietario. */
export const DELETE = manejar(async (request, { params }: Contexto) => {
  const usuario = await requerirUsuario(request);
  const { id, uid } = await params;
  await quitarMiembro(usuario.uid, id, uid);
  return new Response(null, { status: 204 });
});
