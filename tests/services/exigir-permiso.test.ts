import { describe, expect, it } from "vitest";
import { ErrorHttp } from "@/lib/errores";
import { exigirPermiso } from "@/services/permisos";

const miembros = { u1: "propietario", u2: "editor", u3: "lector" } as const;

function statusDe(accion: () => unknown): number | undefined {
  try {
    accion();
  } catch (error) {
    if (error instanceof ErrorHttp) return error.status;
    throw error;
  }
  return undefined;
}

describe("exigirPermiso(miembros, uid, accion)", () => {
  it("devuelve el rol cuando el miembro tiene permiso", () => {
    expect(exigirPermiso(miembros, "u2", "crear")).toBe("editor");
    expect(exigirPermiso(miembros, "u3", "ver")).toBe("lector");
  });

  it("responde 403 si el miembro no tiene permiso", () => {
    expect(statusDe(() => exigirPermiso(miembros, "u3", "crear"))).toBe(403);
    expect(statusDe(() => exigirPermiso(miembros, "u2", "invitar"))).toBe(403);
  });

  it("responde 404 si el usuario no es miembro (no revela el proyecto)", () => {
    expect(statusDe(() => exigirPermiso(miembros, "nadie", "ver"))).toBe(404);
    expect(statusDe(() => exigirPermiso(miembros, "toString", "ver"))).toBe(
      404,
    );
  });
});
