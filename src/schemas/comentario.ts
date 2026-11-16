import { z } from "zod";
import { UidSchema } from "./miembro";

/** Texto plano: React lo escapa al mostrarlo, no se interpreta como HTML. */
const TextoSchema = z
  .string()
  .trim()
  .min(1, "El comentario no puede estar vacío")
  .max(1000, "El comentario admite máximo 1000 caracteres");

/** Documento `proyectos/{id}/tareas/{tid}/comentarios/{cid}`. */
export const ComentarioSchema = z.strictObject({
  id: z.string().min(1),
  uid: UidSchema,
  texto: TextoSchema,
  creadoEn: z.iso.datetime(),
});

export type Comentario = z.infer<typeof ComentarioSchema>;

/** Lo que el cliente envía; el autor y la fecha los pone el servidor. */
export const CrearComentarioSchema = z.strictObject({
  texto: TextoSchema,
});

export type CrearComentario = z.infer<typeof CrearComentarioSchema>;
