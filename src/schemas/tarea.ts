import { z } from "zod";
import { UidSchema } from "./miembro";

export const ESTADOS_TAREA = ["pendiente", "enProgreso", "hecha"] as const;
export const PRIORIDADES = ["baja", "media", "alta"] as const;

export const EstadoTareaSchema = z.enum(ESTADOS_TAREA);
export const PrioridadSchema = z.enum(PRIORIDADES);

export type EstadoTarea = z.infer<typeof EstadoTareaSchema>;
export type Prioridad = z.infer<typeof PrioridadSchema>;

const TituloSchema = z
  .string()
  .trim()
  .min(1, "El título es obligatorio")
  .max(120, "El título admite máximo 120 caracteres");

const DescripcionSchema = z
  .string()
  .trim()
  .max(2000, "La descripción admite máximo 2000 caracteres");

const ResponsableSchema = UidSchema.nullable();

/** Fecha de vencimiento: solo el día, `AAAA-MM-DD`. */
const VenceSchema = z.iso
  .date("La fecha debe tener el formato AAAA-MM-DD")
  .nullable();

/** Documento `proyectos/{id}/tareas/{tid}`. */
export const TareaSchema = z.strictObject({
  id: z.string().min(1),
  titulo: TituloSchema,
  descripcion: DescripcionSchema,
  estado: EstadoTareaSchema,
  prioridad: PrioridadSchema,
  responsableUid: ResponsableSchema,
  vence: VenceSchema,
  creadaPor: UidSchema,
  creadaEn: z.iso.datetime(),
});

export type Tarea = z.infer<typeof TareaSchema>;

/** Lo que el cliente envía al crear; estado, autor y fecha los pone el servidor. */
export const CrearTareaSchema = z.strictObject({
  titulo: TituloSchema,
  descripcion: DescripcionSchema.default(""),
  prioridad: PrioridadSchema.default("media"),
  responsableUid: ResponsableSchema.default(null),
  vence: VenceSchema.default(null),
});

export type CrearTarea = z.infer<typeof CrearTareaSchema>;

/** Cambios parciales a una tarea; al menos un campo. */
export const ActualizarTareaSchema = z
  .strictObject({
    titulo: TituloSchema.optional(),
    descripcion: DescripcionSchema.optional(),
    estado: EstadoTareaSchema.optional(),
    prioridad: PrioridadSchema.optional(),
    responsableUid: ResponsableSchema.optional(),
    vence: VenceSchema.optional(),
  })
  .refine((cambios) => Object.keys(cambios).length > 0, {
    message: "Envía al menos un campo para actualizar",
  });

export type ActualizarTarea = z.infer<typeof ActualizarTareaSchema>;
