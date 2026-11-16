import { cookies } from "next/headers";
import Link from "next/link";
import { COOKIE_SESION } from "@/lib/cookies";
import { BotonCerrarSesion } from "./BotonCerrarSesion";

/** Enlaces para quien no ha iniciado sesión (también es el fallback del Suspense). */
export function EnlacesInvitado() {
  return (
    <ul className="menu">
      <li>
        <Link href="/login">Iniciar sesión</Link>
      </li>
      <li>
        <Link href="/registro">Crear cuenta</Link>
      </li>
    </ul>
  );
}

/**
 * Solo mira si existe la cookie para elegir los enlaces (experiencia de uso).
 * La verificación real ocurre en cada página y ruta de la API.
 */
export async function MenuSesion() {
  const conSesion = (await cookies()).has(COOKIE_SESION);
  if (!conSesion) return <EnlacesInvitado />;
  return (
    <ul className="menu">
      <li>
        <Link href="/proyectos">Mis proyectos</Link>
      </li>
      <li>
        <BotonCerrarSesion />
      </li>
    </ul>
  );
}
