import type { DocumentData } from "firebase-admin/firestore";
import { firestoreAdmin } from "@/lib/firebase/admin";
import type { Actividad } from "@/schemas/actividad";
import { type Proyecto, ProyectoSchema } from "@/schemas/proyecto";
import { datosDeActividad, refActividad } from "./actividad";

/** Único acceso a `proyectos/{id}`. Valida lo que lee con ProyectoSchema. */

const coleccion = () => firestoreAdmin().collection("proyectos");

/** Referencia del proyecto, para escribirlo dentro de transacciones de otros repositorios. */
export const refProyecto = (id: string) => coleccion().doc(id);

export function aProyecto(
  id: string,
  datos: DocumentData | undefined,
): Proyecto {
  return ProyectoSchema.parse({ ...datos, id });
}

export interface PaginaProyectos {
  items: Proyecto[];
  siguienteCursor: string | null;
}

export function nuevoIdProyecto(): string {
  return coleccion().doc().id;
}

export async function obtenerProyecto(id: string): Promise<Proyecto | null> {
  const snap = await coleccion().doc(id).get();
  return snap.exists ? aProyecto(snap.id, snap.data()) : null;
}

/** `create()` falla si el id ya existe (no sobrescribe). */
export async function guardarProyectoNuevo(proyecto: Proyecto): Promise<void> {
  const { id, ...datos } = proyecto;
  await coleccion().doc(id).create(datos);
}

/** Proyectos donde `uid` es miembro, del más nuevo al más viejo. */
export async function listarProyectosDeMiembro(
  uid: string,
  limite: number,
  cursor?: string,
): Promise<PaginaProyectos> {
  let consulta = coleccion()
    .where("miembrosUids", "array-contains", uid)
    .orderBy("creadoEn", "desc")
    .limit(limite + 1);
  if (cursor) {
    const ultimo = await coleccion().doc(cursor).get();
    if (ultimo.exists) consulta = consulta.startAfter(ultimo);
  }
  const snap = await consulta.get();
  const docs = snap.docs.slice(0, limite);
  const hayMas = snap.docs.length > limite;
  return {
    items: docs.map((doc) => aProyecto(doc.id, doc.data())),
    siguienteCursor: hayMas ? (docs.at(-1)?.id ?? null) : null,
  };
}

/**
 * Lee el proyecto y escribe la membresía en una transacción.
 * `cambio` aplica las reglas de negocio y puede lanzar ErrorHttp para abortar.
 * Si `registrar` devuelve un registro, se escribe en la misma transacción.
 */
export async function modificarMembresia(
  id: string,
  cambio: (proyecto: Proyecto | null) => Proyecto,
  registrar?: (antes: Proyecto, despues: Proyecto) => Actividad | null,
): Promise<Proyecto> {
  const ref = coleccion().doc(id);
  return firestoreAdmin().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const antes = snap.exists ? aProyecto(snap.id, snap.data()) : null;
    const nuevo = cambio(antes);
    tx.update(ref, {
      miembros: nuevo.miembros,
      miembrosUids: nuevo.miembrosUids,
      propietarioUid: nuevo.propietarioUid,
    });
    const actividad = antes ? registrar?.(antes, nuevo) : null;
    if (actividad) {
      tx.create(refActividad(id, actividad), datosDeActividad(actividad));
    }
    return nuevo;
  });
}
