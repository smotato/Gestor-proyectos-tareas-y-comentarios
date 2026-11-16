import { z } from "zod";
import { ConsultaListaSchema } from "./lista";
import { UidSchema } from "./miembro";
import { EstadoTareaSchema } from "./tarea";

/** Filtros de la lista de tareas; viajan en la URL (`?estado=…&mias=1`). */
export const FiltrosTareasSchema = z.strictObject({
  estado: EstadoTareaSchema.optional(),
  responsable: UidSchema.optional(),
  mias: z.literal("1").optional(),
});

export type FiltrosTareas = z.infer<typeof FiltrosTareasSchema>;

/** Consulta de `GET /api/proyectos/:id/tareas`: filtros y paginación. */
export const ConsultaTareasSchema = z.strictObject({
  ...FiltrosTareasSchema.shape,
  ...ConsultaListaSchema.shape,
});
