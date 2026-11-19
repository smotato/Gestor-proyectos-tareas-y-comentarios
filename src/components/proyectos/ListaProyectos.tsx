import Link from "next/link";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Insignia } from "@/components/ui/Insignia";
import { sesionRequerida } from "@/lib/proyectos-servidor";
import { ETIQUETA_ROL } from "@/lib/roles";
import { listarMisProyectos } from "@/services/proyectos";
import { BotonNuevoProyecto } from "./BotonNuevoProyecto";

const LIMITE_PAGINA = 50;

/** Lista de mis proyectos (Server Component: va dentro de un <Suspense>). */
export async function ListaProyectos() {
  const usuario = await sesionRequerida();
  const { items } = await listarMisProyectos(usuario.uid, {
    limite: LIMITE_PAGINA,
  });

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Aún no tienes proyectos"
        mensaje="Crea el primero o pide a alguien de tu equipo un código de invitación."
        accion={<BotonNuevoProyecto texto="Crear mi primer proyecto" />}
      />
    );
  }

  return (
    <ul className="lista-tarjetas">
      {items.map((proyecto) => (
        <li key={proyecto.id} className="lista-tarjetas__item">
          <Link href={`/proyectos/${proyecto.id}`} className="enlace-fuerte">
            {proyecto.nombre}
          </Link>
          <p className="proyecto__datos">
            <Insignia tono={proyecto.rol === "propietario" ? "info" : "neutra"}>
              {`Tu rol: ${ETIQUETA_ROL[proyecto.rol]}`}
            </Insignia>
            <span className="texto-tenue">
              {proyecto.totalMiembros}{" "}
              {proyecto.totalMiembros === 1 ? "miembro" : "miembros"}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}
