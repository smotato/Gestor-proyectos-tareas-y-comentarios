import {
  COOKIE_SESION,
  cookieSesion,
  cookieSesionBorrada,
  leerCookie,
} from "@/lib/cookies";
import { leerJson, manejar } from "@/lib/http";
import { crearCookieSesion, revocarSesion } from "@/lib/sesion";
import { IniciarSesionSchema } from "@/schemas/sesion";

// Sin `export const runtime`: con cacheComponents Next 16 no lo admite
// y estas rutas ya corren en Node.js.

function sinContenido(cookie: string): Response {
  return new Response(null, { status: 204, headers: { "Set-Cookie": cookie } });
}

/** Cambia un idToken reciente por la cookie de sesión HttpOnly. */
export const POST = manejar(async (request) => {
  const { idToken } = await leerJson(request, IniciarSesionSchema);
  return sinContenido(cookieSesion(await crearCookieSesion(idToken)));
});

/** Cierra la sesión: revoca los refresh tokens y borra la cookie. */
export const DELETE = manejar(async (request) => {
  await revocarSesion(leerCookie(request.headers.get("cookie"), COOKIE_SESION));
  return sinContenido(cookieSesionBorrada());
});
