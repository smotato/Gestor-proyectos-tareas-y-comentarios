import type { Tarea } from "@/schemas/tarea";

/** Miembro como opción de un selector (`nombre` es su correo o, si falta, su uid). */
export interface OpcionMiembro {
  uid: string;
  nombre: string;
}

/** Qué pide abrir el diálogo: una tarea nueva o editar una existente. */
export type SolicitudDialogo =
  { modo: "crear" } | { modo: "editar"; tarea: Tarea };
