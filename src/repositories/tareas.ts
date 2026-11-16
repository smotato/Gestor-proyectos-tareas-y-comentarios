import type { DocumentData } from "firebase-admin/firestore";
import { firestoreAdmin } from "@/lib/firebase/admin";
import { type EstadoTarea, type Tarea, TareaSchema } from "@/schemas/tarea";

/** Único acceso a `proyectos/{id}/tareas/{tid}`. Valida lo que lee con Zod. */

const coleccion = (proyectoId: string) =>
  firestoreAdmin().collection("proyectos").doc(proyectoId).collection("tareas");

function aTarea(id: string, datos: DocumentData | undefined): Tarea {
  return TareaSchema.parse({ ...datos, id });
}

/** El id es el del documento: no se guarda dentro de él. */
function datosDeTarea(tarea: Tarea): DocumentData {
  return Object.fromEntries(
    Object.entries(tarea).filter(([campo]) => campo !== "id"),
  );
}

export interface FiltroTareas {
  estado?: EstadoTarea;
  responsableUid?: string;
  limite: number;
  cursor?: string;
}

export interface PaginaTareas {
  items: Tarea[];
  siguienteCursor: string | null;
}

export function nuevoIdTarea(proyectoId: string): string {
  return coleccion(proyectoId).doc().id;
}

export async function obtenerTarea(
  proyectoId: string,
  id: string,
): Promise<Tarea | null> {
  const snap = await coleccion(proyectoId).doc(id).get();
  return snap.exists ? aTarea(snap.id, snap.data()) : null;
}

/** Las más nuevas primero. Los filtros con igualdad usan los índices compuestos. */
export async function listarTareas(
  proyectoId: string,
  filtro: FiltroTareas,
): Promise<PaginaTareas> {
  let consulta = coleccion(proyectoId).orderBy("creadaEn", "desc");
  if (filtro.estado) consulta = consulta.where("estado", "==", filtro.estado);
  if (filtro.responsableUid) {
    consulta = consulta.where("responsableUid", "==", filtro.responsableUid);
  }
  if (filtro.cursor) {
    const ultimo = await coleccion(proyectoId).doc(filtro.cursor).get();
    if (ultimo.exists) consulta = consulta.startAfter(ultimo);
  }
  const snap = await consulta.limit(filtro.limite + 1).get();
  const docs = snap.docs.slice(0, filtro.limite);
  const hayMas = snap.docs.length > filtro.limite;
  return {
    items: docs.map((doc) => aTarea(doc.id, doc.data())),
    siguienteCursor: hayMas ? (docs.at(-1)?.id ?? null) : null,
  };
}

/** `create()` falla si el id ya existe (no sobrescribe). */
export async function guardarTareaNueva(
  proyectoId: string,
  tarea: Tarea,
): Promise<void> {
  await coleccion(proyectoId).doc(tarea.id).create(datosDeTarea(tarea));
}

/** Lee y escribe en una transacción; `cambio` puede lanzar ErrorHttp para abortar. */
export async function modificarTarea(
  proyectoId: string,
  id: string,
  cambio: (actual: Tarea | null) => Tarea,
): Promise<Tarea> {
  const ref = coleccion(proyectoId).doc(id);
  return firestoreAdmin().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const nueva = cambio(snap.exists ? aTarea(snap.id, snap.data()) : null);
    tx.set(ref, datosDeTarea(nueva));
    return nueva;
  });
}

/** Borra la tarea y sus comentarios (subcolección). */
export async function eliminarTarea(
  proyectoId: string,
  id: string,
): Promise<void> {
  await firestoreAdmin().recursiveDelete(coleccion(proyectoId).doc(id));
}
