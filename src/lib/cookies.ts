/** Utilidades de cookies sin dependencias: se usan en la API y en `proxy.ts`. */

export const COOKIE_SESION = "sesion";

/** 5 días (Firebase admite de 5 minutos a 2 semanas). */
export const DURACION_SESION_SEG = 5 * 24 * 60 * 60;

export function leerCookie(
  cabecera: string | null,
  nombre: string,
): string | null {
  if (!cabecera) return null;
  for (const parte of cabecera.split(";")) {
    const [clave, ...resto] = parte.trim().split("=");
    if (clave === nombre) return resto.join("=");
  }
  return null;
}

export function cookieSesion(
  valor: string,
  maxAgeSeg: number = DURACION_SESION_SEG,
): string {
  return [
    `${COOKIE_SESION}=${valor}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAgeSeg}`,
  ].join("; ");
}

export function cookieSesionBorrada(): string {
  return cookieSesion("", 0);
}
