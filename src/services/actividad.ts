import { ETIQUETA_ROL } from "@/lib/roles";
import { ETIQUETA_ESTADO } from "@/lib/tareas-ui";
import * as repo from "@/repositories/actividad";
import type { AccionActividad, Actividad } from "@/schemas/actividad";
import type { Rol } from "@/schemas/rol";
import type { EstadoTarea } from "@/schemas/tarea";

/** Quién hizo el cambio y cuándo: el servidor lo decide, nunca el cliente. */
export interface OrigenActividad {
  proyectoId: string;
  uid: string;
  ahora: Date;
}

export function nuevaActividad(
  origen: OrigenActividad,
  accion: AccionActividad,
  detalle: string,
): Actividad {
  return {
    id: repo.nuevoIdActividad(origen.proyectoId),
    uid: origen.uid,
    accion,
    detalle,
    creadoEn: origen.ahora.toISOString(),
  };
}

export function detalleTareaCreada(titulo: string): string {
  return `Creó la tarea «${titulo}»`;
}

export function detalleEstado(
  titulo: string,
  antes: EstadoTarea,
  despues: EstadoTarea,
): string {
  const de = ETIQUETA_ESTADO[antes];
  const a = ETIQUETA_ESTADO[despues];
  return `Cambió el estado de «${titulo}» de ${de} a ${a}`;
}

export function detalleComentario(titulo: string): string {
  return `Comentó en «${titulo}»`;
}

export function detalleRol(quien: string, rol: Rol): string {
  return `Cambió el rol de ${quien} a ${ETIQUETA_ROL[rol]}`;
}
