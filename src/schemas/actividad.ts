import { z } from "zod";
import { UidSchema } from "./miembro";

export const ACCIONES_ACTIVIDAD = [
  "tareaCreada",
  "estadoCambiado",
  "comentarioCreado",
  "rolCambiado",
] as const;

export const AccionActividadSchema = z.enum(ACCIONES_ACTIVIDAD);

export type AccionActividad = z.infer<typeof AccionActividadSchema>;

/** Documento `proyectos/{id}/actividad/{aid}`. Solo lo escribe el servidor. */
export const ActividadSchema = z.strictObject({
  id: z.string().min(1),
  uid: UidSchema,
  accion: AccionActividadSchema,
  detalle: z.string().min(1).max(300),
  creadoEn: z.iso.datetime(),
});

export type Actividad = z.infer<typeof ActividadSchema>;
