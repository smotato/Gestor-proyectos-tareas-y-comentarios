import { describe, expect, it } from "vitest";
import {
  CredencialesSchema,
  IniciarSesionSchema,
  RegistroSchema,
} from "@/schemas/sesion";

describe("IniciarSesionSchema", () => {
  it("exige un idToken y nada más", () => {
    expect(IniciarSesionSchema.safeParse({ idToken: "t" }).success).toBe(true);
    expect(IniciarSesionSchema.safeParse({ idToken: "" }).success).toBe(false);
    const conUid = IniciarSesionSchema.safeParse({ idToken: "t", uid: "u" });
    expect(conUid.success).toBe(false);
  });
});

describe("CredencialesSchema y RegistroSchema", () => {
  const datos = { correo: "ana@ejemplo.com", contrasena: "secreta123" };

  it("aceptan un correo y una contraseña válidos", () => {
    expect(CredencialesSchema.safeParse(datos).success).toBe(true);
    expect(RegistroSchema.safeParse(datos).success).toBe(true);
  });

  it("rechazan un correo inválido", () => {
    const malo = { ...datos, correo: "ana" };
    expect(CredencialesSchema.safeParse(malo).success).toBe(false);
    expect(RegistroSchema.safeParse(malo).success).toBe(false);
  });

  it("el registro exige al menos 8 caracteres; el login solo que no esté vacía", () => {
    const corta = { ...datos, contrasena: "1234567" };
    expect(CredencialesSchema.safeParse(corta).success).toBe(true);
    expect(RegistroSchema.safeParse(corta).success).toBe(false);
    const vacia = { ...datos, contrasena: "" };
    expect(CredencialesSchema.safeParse(vacia).success).toBe(false);
  });
});
