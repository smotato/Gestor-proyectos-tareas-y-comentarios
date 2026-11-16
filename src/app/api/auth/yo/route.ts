import { requerirUsuario } from "@/lib/auth";
import { manejar } from "@/lib/http";

/** `200 { usuario: { uid, correo, rol } }` o `401`. */
export const GET = manejar(async (request) =>
  Response.json({ usuario: await requerirUsuario(request) }),
);
