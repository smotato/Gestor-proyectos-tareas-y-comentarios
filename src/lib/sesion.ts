import { authAdmin } from "@/lib/firebase/admin";
import { esErrorDeAuth, usuarioDeCookie } from "./auth";
import { DURACION_SESION_SEG } from "./cookies";
import { noAutenticado } from "./errores";

/** Solo se crea la cookie si el inicio de sesión fue hace menos de 5 minutos. */
const MAX_ANTIGUEDAD_LOGIN_SEG = 5 * 60;

async function verificarIdToken(idToken: string) {
  try {
    return await authAdmin().verifyIdToken(idToken, true);
  } catch (error) {
    if (esErrorDeAuth(error)) throw noAutenticado("Token inválido");
    throw error;
  }
}

export async function crearCookieSesion(idToken: string): Promise<string> {
  const token = await verificarIdToken(idToken);
  const ahoraSeg = Date.now() / 1000;
  if (ahoraSeg - token.auth_time > MAX_ANTIGUEDAD_LOGIN_SEG) {
    throw noAutenticado("Inicia sesión de nuevo");
  }
  return authAdmin().createSessionCookie(idToken, {
    expiresIn: DURACION_SESION_SEG * 1000,
  });
}

/** Revoca los refresh tokens del dueño de la cookie, si es válida. */
export async function revocarSesion(cookie: string | null): Promise<void> {
  const usuario = await usuarioDeCookie(cookie);
  if (usuario) await authAdmin().revokeRefreshTokens(usuario.uid);
}
