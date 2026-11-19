import Link from "next/link";
import {
  miembrosDelProyecto,
  tareaDelProyecto,
} from "@/lib/proyectos-servidor";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { listarComentarios } from "@/services/gestion-comentarios";
import { puede } from "@/services/permisos";
import { DatosTarea } from "./DatosTarea";
import { FormularioComentario } from "./FormularioComentario";
import { ListaComentarios } from "./ListaComentarios";

/** Hasta 100 comentarios (el máximo de la API); no hay paginación en pantalla. */
const LIMITE_COMENTARIOS = 100;

interface PropsDetalle {
  params: Promise<{ id: string; tid: string }>;
}

/**
 * Server Component: verifica la sesión y la membresía (404 si no es miembro
 * o si la tarea no existe). Va dentro de un <Suspense>.
 */
export async function DetalleTarea({ params }: PropsDetalle) {
  const { id, tid } = await params;
  const { usuario, proyecto, rol, tarea } = await tareaDelProyecto(id, tid);
  const [comentarios, miembros] = await Promise.all([
    listarComentarios(proyecto, usuario.uid, tid, {
      limite: LIMITE_COMENTARIOS,
    }),
    miembrosDelProyecto(id),
  ]);
  const nombres = new Map(miembros.map((m) => [m.uid, m.correo ?? m.uid]));
  const responsable = nombres.get(tarea.responsableUid ?? "") ?? null;
  return (
    <article aria-labelledby="titulo-detalle" className="pila">
      <p>
        <Link href={`/proyectos/${id}`} className="enlace-discreto">
          ← Volver al tablero
        </Link>
      </p>
      <Tarjeta>
        <h2 id="titulo-detalle" className="panel__titulo">
          {tarea.titulo}
        </h2>
        <DatosTarea tarea={tarea} responsable={responsable} />
        {tarea.descripcion ? (
          <p className="tarea__descripcion">{tarea.descripcion}</p>
        ) : null}
      </Tarjeta>
      <section aria-labelledby="titulo-comentarios" className="pila">
        <h3 id="titulo-comentarios">
          Comentarios ({comentarios.items.length})
        </h3>
        <ListaComentarios items={comentarios.items} nombres={nombres} />
        {puede(rol, "crear") ? (
          <Tarjeta>
            <FormularioComentario proyectoId={id} tareaId={tid} />
          </Tarjeta>
        ) : (
          <p className="texto-tenue">
            Con el rol de lector puedes leer los comentarios, pero no escribir.
            Pide al propietario que te cambie el rol si necesitas comentar.
          </p>
        )}
      </section>
    </article>
  );
}
