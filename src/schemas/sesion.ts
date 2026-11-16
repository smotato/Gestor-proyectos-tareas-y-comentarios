import { z } from "zod";

/** Cuerpo de `POST /api/auth/sesion`. */
export const IniciarSesionSchema = z.strictObject({
  idToken: z.string().min(1, "Falta el idToken"),
});

const CorreoSchema = z.email("Escribe un correo válido");

/** Formulario de inicio de sesión: no se exige longitud (la cuenta ya existe). */
export const CredencialesSchema = z.strictObject({
  correo: CorreoSchema,
  contrasena: z.string().min(1, "Escribe tu contraseña"),
});

export type Credenciales = z.infer<typeof CredencialesSchema>;

/** Formulario de registro. */
export const RegistroSchema = z.strictObject({
  correo: CorreoSchema,
  contrasena: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña admite máximo 128 caracteres"),
});
