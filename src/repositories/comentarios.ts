import { firestoreAdmin } from "@/lib/firebase/admin";
import type { Actividad } from "@/schemas/actividad";
import { type Comentario, ComentarioSchema } from "@/schemas/comentario";
import { datosDeActividad, refActividad } from "./actividad";
import { despuesDe, type Pagina, paginar, sinId } from "./utilidades";

/** Único acceso a `proyectos/{id}/tareas/{tid}/comentarios/{cid}`. */

const coleccion = (proyectoId: string, tareaId: string) =>
  firestoreAdmin()
    .collection("proyectos")
    .doc(proyectoId)
    .collection("tareas")
    .doc(tareaId)
    .collection("comentarios");

export function nuevoIdComentario(proyectoId: string, tareaId: string) {
  return coleccion(proyectoId, tareaId).doc().id;
}

/** Guarda el comentario y su registro de actividad en un solo lote. */
export async function guardarComentarioNuevo(
  proyectoId: string,
  tareaId: string,
  comentario: Comentario,
  actividad: Actividad,
): Promise<void> {
  const lote = firestoreAdmin().batch();
  const ref = coleccion(proyectoId, tareaId).doc(comentario.id);
  lote.create(ref, sinId(comentario));
  lote.create(refActividad(proyectoId, actividad), datosDeActividad(actividad));
  await lote.commit();
}

/** En orden de escritura: los más antiguos primero. */
export async function listarComentarios(
  proyectoId: string,
  tareaId: string,
  limite: number,
  cursor?: string,
): Promise<Pagina<Comentario>> {
  const base = coleccion(proyectoId, tareaId);
  const consulta = await despuesDe(
    base.orderBy("creadoEn", "asc"),
    base,
    cursor,
  );
  return paginar(consulta, limite, (doc) =>
    ComentarioSchema.parse({ ...doc.data(), id: doc.id }),
  );
}
