import type { DecodedIdToken } from "firebase-admin/auth";
import { authAdmin } from "@/lib/firebase/admin";
import { COOKIE_SESION, leerCookie } from "./cookies";
import { noAutenticado } from "./errores";

export interface Usuario {
  uid: string;
  correo: string | null;
  rol: string | null;
}

/** Errores de Firebase Auth (token vencido, revocado, mal formado…). */
export function esErrorDeAuth(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const codigo: unknown = Reflect.get(error, "code");
  return typeof codigo === "string" && codigo.startsWith("auth/");
}

function aUsuario(token: DecodedIdToken): Usuario {
  const rol: unknown = token.rol;
  return {
    uid: token.uid,
    correo: token.email ?? null,
    rol: typeof rol === "string" ? rol : null,
  };
}

/** Un token inválido da `null`; otros fallos (red, configuración) se propagan → 500. */
async function verificar(
  verificador: () => Promise<DecodedIdToken>,
): Promise<Usuario | null> {
  try {
    return aUsuario(await verificador());
  } catch (error) {
    if (esErrorDeAuth(error)) return null;
    throw error;
  }
}

export async function usuarioDeCookie(
  valor: string | null,
): Promise<Usuario | null> {
  if (!valor) return null;
  return verificar(() => authAdmin().verifySessionCookie(valor, true));
}

async function usuarioDeBearer(
  cabecera: string | null,
): Promise<Usuario | null> {
  const token = cabecera?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  return verificar(() => authAdmin().verifyIdToken(token, true));
}

/**
 * Usuario de la petición: cookie de sesión o, para Bruno/Postman,
 * `Authorization: Bearer <idToken>`. Sin sesión válida → 401.
 */
export async function requerirUsuario(request: Request): Promise<Usuario> {
  const cookie = leerCookie(request.headers.get("cookie"), COOKIE_SESION);
  const usuario =
    (await usuarioDeCookie(cookie)) ??
    (await usuarioDeBearer(request.headers.get("authorization")));
  if (!usuario) throw noAutenticado();
  return usuario;
}
