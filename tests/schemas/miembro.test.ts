import { describe, expect, it } from "vitest";
import { MiembroSchema, MiembrosSchema } from "@/schemas/miembro";

describe("MiembroSchema", () => {
  it("acepta un miembro válido", () => {
    expect(MiembroSchema.safeParse({ uid: "u1", rol: "editor" }).success).toBe(
      true,
    );
  });

  it("rechaza un uid vacío o solo con espacios", () => {
    expect(MiembroSchema.safeParse({ uid: "", rol: "editor" }).success).toBe(
      false,
    );
    expect(MiembroSchema.safeParse({ uid: "   ", rol: "editor" }).success).toBe(
      false,
    );
  });

  it("rechaza un rol inválido", () => {
    expect(MiembroSchema.safeParse({ uid: "u1", rol: "admin" }).success).toBe(
      false,
    );
  });

  it("rechaza campos desconocidos", () => {
    const resultado = MiembroSchema.safeParse({
      uid: "u1",
      rol: "lector",
      esAdmin: true,
    });
    expect(resultado.success).toBe(false);
  });
});

describe("MiembrosSchema", () => {
  it("acepta un mapa uid → rol", () => {
    const resultado = MiembrosSchema.safeParse({
      u1: "propietario",
      u2: "lector",
    });
    expect(resultado.success).toBe(true);
  });

  it("rechaza un rol inválido dentro del mapa", () => {
    expect(MiembrosSchema.safeParse({ u1: "jefe" }).success).toBe(false);
  });
});
