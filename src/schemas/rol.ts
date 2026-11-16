import { z } from "zod";

export const ROLES = ["propietario", "editor", "lector"] as const;

export const RolSchema = z.enum(ROLES);

export type Rol = z.infer<typeof RolSchema>;
