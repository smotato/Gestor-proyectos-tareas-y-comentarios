import { requerirUsuario } from "@/lib/auth";
import { manejar } from "@/lib/http";
import { aceptarInvitacion } from "@/services/invitaciones";

interface Contexto {
  params: Promise<{ codigo: string }>;
}

/**
 * `POST` → 200 `{ proyectoId, rol }`. El uid es el de la sesión.
 * 404 si el código no existe, 409 si ya se usó o ya eres miembro, 410 si venció.
 */
export const POST = manejar(async (request, { params }: Contexto) => {
  const usuario = await requerirUsuario(request);
  const { codigo } = await params;
  return Response.json(await aceptarInvitacion(usuario.uid, codigo));
});
