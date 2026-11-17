import type { DocumentData } from "firebase-admin/firestore";
import { firestoreAdmin } from "@/lib/firebase/admin";
import { type Actividad, ActividadSchema } from "@/schemas/actividad";
import { despuesDe, type Pagina, paginar, sinId } from "./utilidades";

/** Único acceso a `proyectos/{id}/actividad/{aid}`. */

const coleccion = (proyectoId: string) =>
  firestoreAdmin()
    .collection("proyectos")
    .doc(proyectoId)
    .collection("actividad");

export function nuevoIdActividad(proyectoId: string): string {
  return coleccion(proyectoId).doc().id;
}

/**
 * Referencia y datos del registro: los repositorios de tareas, comentarios y
 * proyectos lo escriben en la misma transacción o lote que el cambio, así
 * nunca queda un cambio sin su registro.
 */
export function refActividad(proyectoId: string, actividad: Actividad) {
  return coleccion(proyectoId).doc(actividad.id);
}

export function datosDeActividad(actividad: Actividad): DocumentData {
  return sinId(actividad);
}

/** Lo más reciente primero. */
export async function listarActividad(
  proyectoId: string,
  limite: number,
  cursor?: string,
): Promise<Pagina<Actividad>> {
  const base = coleccion(proyectoId);
  const consulta = await despuesDe(
    base.orderBy("creadoEn", "desc"),
    base,
    cursor,
  );
  return paginar(consulta, limite, (doc) =>
    ActividadSchema.parse({ ...doc.data(), id: doc.id }),
  );
}
