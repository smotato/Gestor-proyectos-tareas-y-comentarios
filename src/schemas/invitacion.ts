import { z } from "zod";
import { ID_DOCUMENTO } from "./lista";
import { RolSchema } from "./rol";

/** Roles que se ofrecen al invitar; un propietario se asigna después con el cambio de rol. */
export const RolInvitableSchema = z.enum(
  ["editor", "lector"],
  "Elige un rol válido para la invitación",
);

/** Cuerpo de `POST /api/proyectos/:id/invitaciones`. */
export const CrearInvitacionSchema = z.strictObject({
  rol: RolInvitableSchema,
});

/** Documento `invitaciones/{codigo}`: solo lo escribe la API. */
export const InvitacionSchema = z.strictObject({
  codigo: z.string().regex(ID_DOCUMENTO),
  proyectoId: z.string().min(1),
  rol: RolSchema,
  expira: z.iso.datetime(),
  usada: z.boolean(),
});

export type Invitacion = z.infer<typeof InvitacionSchema>;

/** Respuesta de crear una invitación. */
export const RespuestaInvitacionSchema = z.strictObject({
  invitacion: InvitacionSchema,
});

/** Respuesta de aceptar una invitación. */
export const RespuestaAceptarSchema = z.object({
  proyectoId: z.string().min(1),
  rol: RolSchema,
});
