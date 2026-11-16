import { describe, expect, it } from "vitest";
import { CrearProyectoSchema, ProyectoSchema } from "@/schemas/proyecto";

const proyectoValido = {
  id: "p1",
  nombre: "Proyecto de clase",
  propietarioUid: "u1",
  miembros: { u1: "propietario", u2: "editor", u3: "lector" },
  miembrosUids: ["u1", "u2", "u3"],
  creadoEn: "2026-11-16T10:00:00.000Z",
};

describe("ProyectoSchema · campos", () => {
  it("acepta un proyecto válido", () => {
    expect(ProyectoSchema.safeParse(proyectoValido).success).toBe(true);
  });

  it("rechaza campos desconocidos", () => {
    const resultado = ProyectoSchema.safeParse({
      ...proyectoValido,
      publico: true,
    });
    expect(resultado.success).toBe(false);
  });

  it.each(["", "   ", "x".repeat(101)])("rechaza el nombre %j", (nombre) => {
    expect(
      ProyectoSchema.safeParse({ ...proyectoValido, nombre }).success,
    ).toBe(false);
  });

  it("rechaza creadoEn que no sea ISO 8601", () => {
    const resultado = ProyectoSchema.safeParse({
      ...proyectoValido,
      creadoEn: "16/11/2026",
    });
    expect(resultado.success).toBe(false);
  });
});

describe("ProyectoSchema · membresía", () => {
  it("rechaza un proyecto sin ningún propietario", () => {
    const resultado = ProyectoSchema.safeParse({
      ...proyectoValido,
      miembros: { u1: "editor", u2: "editor", u3: "lector" },
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza si propietarioUid no es propietario en miembros", () => {
    const resultado = ProyectoSchema.safeParse({
      ...proyectoValido,
      propietarioUid: "u2",
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza si miembrosUids no coincide con las claves de miembros", () => {
    const faltante = ProyectoSchema.safeParse({
      ...proyectoValido,
      miembrosUids: ["u1", "u2"],
    });
    const sobrante = ProyectoSchema.safeParse({
      ...proyectoValido,
      miembrosUids: ["u1", "u2", "u3", "u4"],
    });
    expect(faltante.success).toBe(false);
    expect(sobrante.success).toBe(false);
  });
});

describe("CrearProyectoSchema", () => {
  it("acepta solo el nombre y lo recorta", () => {
    const resultado = CrearProyectoSchema.safeParse({ nombre: "  Tablero  " });
    expect(resultado.success && resultado.data).toEqual({ nombre: "Tablero" });
  });

  it.each([
    { propietarioUid: "otro" },
    { miembros: { atacante: "propietario" } },
  ])("rechaza campos que decide el servidor: %o", (extra) => {
    const resultado = CrearProyectoSchema.safeParse({
      nombre: "Tablero",
      ...extra,
    });
    expect(resultado.success).toBe(false);
  });
});
