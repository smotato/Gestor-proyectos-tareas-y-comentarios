import Link from "next/link";
import { sesionRequerida } from "@/lib/proyectos-servidor";
import { ETIQUETA_ROL } from "@/lib/roles";
import { listarMisProyectos } from "@/services/proyectos";

const LIMITE_PAGINA = 50;

/** Lista de mis proyectos (Server Component: va dentro de un <Suspense>). */
export async function ListaProyectos() {
  const usuario = await sesionRequerida();
  const { items } = await listarMisProyectos(usuario.uid, {
    limite: LIMITE_PAGINA,
  });

  if (items.length === 0) {
    return (
      <p className="vacio">
        Aún no tienes proyectos. Crea el primero con el formulario de arriba o
        pide a alguien de tu equipo un código de invitación.
      </p>
    );
  }

  return (
    <ul className="lista-tarjetas">
      {items.map((proyecto) => (
        <li key={proyecto.id} className="lista-tarjetas__item">
          <Link href={`/proyectos/${proyecto.id}`} className="enlace-fuerte">
            {proyecto.nombre}
          </Link>
          <p className="texto-tenue">
            Tu rol: {ETIQUETA_ROL[proyecto.rol]} · {proyecto.totalMiembros}{" "}
            {proyecto.totalMiembros === 1 ? "miembro" : "miembros"}
          </p>
        </li>
      ))}
    </ul>
  );
}
