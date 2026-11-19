import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Insignia } from "@/components/ui/Insignia";
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
    <tr>
      <th scope="row" data-etiqueta="Miembro">
        {nombre}
        {esYo ? " (tú)" : ""}
      </th>
      <td data-etiqueta="Rol">
        <Insignia tono={miembro.rol === "propietario" ? "info" : "neutra"}>
          {ETIQUETA_ROL[miembro.rol]}
        </Insignia>
      </td>
      {gestiona ? (
        <td data-etiqueta="Acciones">
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
        </td>
      ) : null}
    </tr>
  );
}

interface PropsTabla {
  items: readonly MiembroVista[];
  proyecto: Proyecto;
  uidActual: string;
  gestiona: boolean;
}

/**
 * Tabla de miembros. En pantallas pequeñas el CSS apila cada fila como una
 * tarjeta (con la etiqueta de cada dato), sin duplicar el contenido.
 */
function TablaMiembros({ items, proyecto, uidActual, gestiona }: PropsTabla) {
  return (
    <table className="tabla">
      <caption className="sr-only">Miembros del proyecto y sus roles</caption>
      <thead>
        <tr>
          <th scope="col">Miembro</th>
          <th scope="col">Rol</th>
          {gestiona ? <th scope="col">Acciones</th> : null}
        </tr>
      </thead>
      <tbody>
        {items.map((miembro) => (
          <FilaMiembro
            key={miembro.uid}
            miembro={miembro}
            proyecto={proyecto}
            esYo={miembro.uid === uidActual}
            gestiona={gestiona}
          />
        ))}
      </tbody>
    </table>
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
  const gestiona = puede(rol, "cambiarRol");

  if (items.length === 0) {
    return (
      <EstadoVacio mensaje="Este proyecto todavía no tiene miembros. El propietario puede invitar a su equipo con un código." />
    );
  }

  return (
    <div className="pila">
      <TablaMiembros
        items={items}
        proyecto={proyecto}
        uidActual={usuario.uid}
        gestiona={gestiona}
      />
      {gestiona ? null : (
        <p className="texto-tenue">
          Solo el propietario puede cambiar roles o quitar miembros.
        </p>
      )}
    </div>
  );
}
