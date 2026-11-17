import { describe, expect, it } from "vitest";
import {
  CrearInvitacionSchema,
  InvitacionSchema,
  RespuestaAceptarSchema,
} from "@/schemas/invitacion";

const invitacion = {
  codigo: "Zm9vYmFyMTIzNDU2Nzg5MA",
  proyectoId: "p1",
  rol: "editor",
  expira: "2026-11-23T10:00:00.000Z",
  usada: false,
};

describe("CrearInvitacionSchema", () => {
  it.each(["editor", "lector"])("acepta el rol %s", (rol) => {
    expect(CrearInvitacionSchema.safeParse({ rol }).success).toBe(true);
  });

  it.each([
    { rol: "propietario" },
    { rol: "" },
    {},
    { rol: "lector", proyectoId: "p2" },
    { rol: "lector", expira: "2099-01-01T00:00:00.000Z" },
  ])("rechaza %o", (entrada) => {
    expect(CrearInvitacionSchema.safeParse(entrada).success).toBe(false);
  });

  it("explica el error del rol en español", () => {
    const resultado = CrearInvitacionSchema.safeParse({ rol: "jefe" });
    expect(resultado.error?.issues[0]?.message).toBe(
      "Elige un rol válido para la invitación",
    );
  });
});

describe("InvitacionSchema y RespuestaAceptarSchema", () => {
  it("acepta una invitación válida", () => {
    expect(InvitacionSchema.safeParse(invitacion).success).toBe(true);
  });

  it.each([
    ["usada", "no"],
    ["expira", "mañana"],
    ["codigo", "a/b"],
    ["rol", "jefe"],
    ["creadaPor", "u1"],
  ])("rechaza %s = %j", (campo, valor) => {
    const resultado = InvitacionSchema.safeParse({
      ...invitacion,
      [campo]: valor,
    });
    expect(resultado.success).toBe(false);
  });

  it("la respuesta de aceptar lleva el proyecto y el rol", () => {
    const valida = { proyectoId: "p1", rol: "lector" };
    expect(RespuestaAceptarSchema.safeParse(valida).success).toBe(true);
    expect(RespuestaAceptarSchema.safeParse({ rol: "lector" }).success).toBe(
      false,
    );
  });
});
