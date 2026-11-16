import { z } from "zod";
import { RolSchema } from "./rol";

export const UidSchema = z.string().trim().min(1, "El uid es obligatorio");

/** Un miembro del proyecto tal como lo expone la API. */
export const MiembroSchema = z.strictObject({
  uid: UidSchema,
  rol: RolSchema,
});

export type Miembro = z.infer<typeof MiembroSchema>;

/** Mapa `uid → rol` tal como se guarda en `proyectos/{id}.miembros`. */
export const MiembrosSchema = z.record(z.string().min(1), RolSchema);

export type Miembros = z.infer<typeof MiembrosSchema>;
