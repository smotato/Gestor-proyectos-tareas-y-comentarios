"use client";

import { usePathname } from "next/navigation";
import { NavProyecto } from "@/components/proyectos/NavProyecto";
import { EnlaceMenu } from "./EnlaceMenu";
import { IconoEntrar, IconoMiembros, IconoProyectos } from "./Iconos";

function EnlacesInvitado({ ruta }: { ruta: string }) {
  return (
    <ul className="nav-lateral__lista">
      <li>
        <EnlaceMenu
          href="/login"
          texto="Iniciar sesión"
          icono={<IconoEntrar />}
          activo={ruta === "/login"}
        />
      </li>
      <li>
        <EnlaceMenu
          href="/registro"
          texto="Crear cuenta"
          icono={<IconoMiembros />}
          activo={ruta === "/registro"}
        />
      </li>
    </ul>
  );
}

function EnlacesGenerales({ ruta }: { ruta: string }) {
  return (
    <ul className="nav-lateral__lista">
      <li>
        <EnlaceMenu
          href="/proyectos"
          texto="Proyectos"
          icono={<IconoProyectos />}
          activo={ruta === "/proyectos"}
        />
      </li>
    </ul>
  );
}

/** Navegación del menú lateral; dentro de un proyecto añade sus secciones. */
export function NavLateral({ conSesion }: { conSesion: boolean }) {
  const ruta = usePathname();
  const proyecto = /^\/proyectos\/([^/]+)/.exec(ruta)?.[1];
  return (
    <nav aria-label="Principal" className="menu-lateral__nav">
      <div className="nav-lateral">
        {conSesion ? (
          <EnlacesGenerales ruta={ruta} />
        ) : (
          <EnlacesInvitado ruta={ruta} />
        )}
        {conSesion && proyecto ? (
          <div>
            <NavProyecto id={proyecto} />
          </div>
        ) : null}
      </div>
    </nav>
  );
}
