import { authAdmin } from "@/lib/firebase/admin";

/** Firebase Auth admite hasta 100 usuarios por consulta. */
const LOTE = 100;

/** Correo de cada uid (null si el usuario no existe o no tiene correo). */
export async function correosPorUid(
  uids: readonly string[],
): Promise<Map<string, string | null>> {
  const correos = new Map<string, string | null>();
  for (let inicio = 0; inicio < uids.length; inicio += LOTE) {
    const lote = uids.slice(inicio, inicio + LOTE).map((uid) => ({ uid }));
    const resultado = await authAdmin().getUsers(lote);
    for (const usuario of resultado.users) {
      correos.set(usuario.uid, usuario.email ?? null);
    }
  }
  return correos;
}
