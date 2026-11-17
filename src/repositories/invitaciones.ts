import type { DocumentData } from "firebase-admin/firestore";
import { firestoreAdmin } from "@/lib/firebase/admin";
import { type Invitacion, InvitacionSchema } from "@/schemas/invitacion";
import type { Proyecto } from "@/schemas/proyecto";
import { aProyecto, refProyecto } from "./proyectos";

/** Único acceso a `invitaciones/{codigo}`. El código es el id del documento. */

const coleccion = () => firestoreAdmin().collection("invitaciones");

function aInvitacion(
  codigo: string,
  datos: DocumentData | undefined,
): Invitacion {
  return InvitacionSchema.parse({ ...datos, codigo });
}

/** `create()` falla si el código ya existe (no sobrescribe). */
export async function guardarInvitacionNueva(
  invitacion: Invitacion,
): Promise<void> {
  const { codigo, ...datos } = invitacion;
  await coleccion().doc(codigo).create(datos);
}

export async function obtenerInvitacion(
  codigo: string,
): Promise<Invitacion | null> {
  const snap = await coleccion().doc(codigo).get();
  return snap.exists ? aInvitacion(snap.id, snap.data()) : null;
}

type Decidir = (
  invitacion: Invitacion | null,
  proyecto: Proyecto | null,
) => Proyecto;

/**
 * En una sola transacción lee la invitación y su proyecto, deja que `decidir`
 * aplique las reglas (puede lanzar ErrorHttp para abortar) y escribe a la vez
 * el nuevo miembro y la invitación como usada. Si dos personas aceptan el mismo
 * código al mismo tiempo, la segunda vuelve a leerlo ya usado.
 */
export async function aceptarInvitacion(
  codigo: string,
  decidir: Decidir,
): Promise<Proyecto> {
  const refInvitacion = coleccion().doc(codigo);
  return firestoreAdmin().runTransaction(async (tx) => {
    const snapInvitacion = await tx.get(refInvitacion);
    const invitacion = snapInvitacion.exists
      ? aInvitacion(snapInvitacion.id, snapInvitacion.data())
      : null;
    const snapProyecto = invitacion
      ? await tx.get(refProyecto(invitacion.proyectoId))
      : null;
    const proyecto = snapProyecto?.exists
      ? aProyecto(snapProyecto.id, snapProyecto.data())
      : null;
    const nuevo = decidir(invitacion, proyecto);
    tx.update(refProyecto(nuevo.id), {
      miembros: nuevo.miembros,
      miembrosUids: nuevo.miembrosUids,
      propietarioUid: nuevo.propietarioUid,
    });
    tx.update(refInvitacion, { usada: true });
    return nuevo;
  });
}
