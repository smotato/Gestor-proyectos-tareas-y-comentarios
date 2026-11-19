import { usuarioActual } from "@/lib/auth-servidor";
import { BotonCerrarSesion } from "../BotonCerrarSesion";
import { Esqueleto } from "../Esqueleto";
import { NavLateral } from "./NavLateral";

/** Mientras se verifica la sesión: esqueleto dentro del mismo `<nav>`. */
export function MenuLateralCargando() {
  return (
    <nav aria-label="Principal" className="menu-lateral__nav">
      <Esqueleto etiqueta="Cargando el menú…" />
    </nav>
  );
}

/**
 * Enlaces del menú y, abajo, el correo y «Cerrar sesión». Verifica la sesión
 * en el servidor: la autorización real sigue ocurriendo en cada página y API.
 * Va dentro de un <Suspense>.
 */
export async function MenuLateral() {
  const usuario = await usuarioActual();
  return (
    <>
      <NavLateral conSesion={usuario !== null} />
      {usuario ? (
        <div className="menu-lateral__pie">
          <p className="menu-lateral__correo">
            {usuario.correo ?? "Sesión iniciada"}
          </p>
          <BotonCerrarSesion />
        </div>
      ) : null}
    </>
  );
}
