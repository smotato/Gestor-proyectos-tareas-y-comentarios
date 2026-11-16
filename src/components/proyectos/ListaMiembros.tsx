import { proyectoDelUsuario } from "@/lib/proyectos-servidor";
import { ETIQUETA_ROL } from "@/lib/roles";
import type { Proyecto } from "@/schemas/proyecto";
import { ROLES } from "@/schemas/rol";
import {
  puede,
  puedeCambiarRolDe,
  puedeQuitarMiembro,
} from "@/services/permisos";
import { type MiembroVista, miembrosConCorreo } from "@/services/proyectos";
import { AccionesMiembro } from "./AccionesMiembro";

interface PropsFila {
  miembro: MiembroVista;
  proyecto: Proyecto;
  esYo: boolean;
  gestiona: boolean;
}

function FilaMiembro({ miembro, proyecto, esYo, gestiona }: PropsFila) {
  const nombre = miembro.correo ?? miembro.uid;
  return (
    <li className="lista-tarjetas__item">
      <p className="enlace-fuerte">
        {nombre}
        {esYo ? " (tú)" : ""}
      </p>
      <p className="texto-tenue">{ETIQUETA_ROL[miembro.rol]}</p>
      {gestiona ? (
        <AccionesMiembro
          proyectoId={proyecto.id}
          uid={miembro.uid}
          nombre={nombre}
          rol={miembro.rol}
          rolesPermitidos={ROLES.filter((rol) =>
            puedeCambiarRolDe(proyecto.miembros, miembro.uid, rol),
          )}
          puedeQuitar={puedeQuitarMiembro(proyecto.miembros, miembro.uid)}
        />
      ) : null}
    </li>
  );
}

/** Miembros con su rol; las acciones solo aparecen si el rol lo permite. */
export async function ListaMiembros({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { usuario, proyecto, rol } = await proyectoDelUsuario(id);
  const items = await miembrosConCorreo(proyecto);

  if (items.length === 0) {
    return <p className="vacio">Este proyecto todavía no tiene miembros.</p>;
  }

  return (
    <ul className="lista-tarjetas">
      {items.map((miembro) => (
        <FilaMiembro
          key={miembro.uid}
          miembro={miembro}
          proyecto={proyecto}
          esYo={miembro.uid === usuario.uid}
          gestiona={puede(rol, "cambiarRol")}
        />
      ))}
    </ul>
  );
}
