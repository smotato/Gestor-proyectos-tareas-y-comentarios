import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_SESION } from "@/lib/cookies";

/**
 * Solo mejora la experiencia: si falta la cookie, manda a /login.
 * NO es la seguridad real; cada ruta y página verifica la sesión en el servidor.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIE_SESION)) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("siguiente", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/proyectos/:path*", "/invitacion/:path*"],
};
