import { describe, expect, it } from "vitest";
import { ErrorHttp } from "@/lib/errores";
import type { Tarea } from "@/schemas/tarea";
import { aplicarCambiosTarea, prepararTareaNueva } from "@/services/tareas";

const miembros = { u1: "propietario", u2: "editor", u3: "lector" } as const;
const ahora = new Date("2026-11-16T10:00:00.000Z");

const tarea: Tarea = {
  id: "t1",
  titulo: "Maqueta",
  descripcion: "",
  estado: "pendiente",
  prioridad: "media",
  responsableUid: null,
  vence: null,
  creadaPor: "u1",
  creadaEn: "2026-11-16T10:00:00.000Z",
};

function errorDe(accion: () => unknown): ErrorHttp {
  try {
    accion();
  } catch (error) {
    if (error instanceof ErrorHttp) return error;
    throw error;
  }
  throw new Error("Se esperaba un ErrorHttp");
}

const crear = (actorUid: string, entrada: unknown) =>
  prepararTareaNueva({ id: "t1", actorUid, miembros, entrada, ahora });

const editar = (actorUid: string, cambios: unknown) =>
  aplicarCambiosTarea({ actorUid, miembros, tarea, cambios });

describe("prepararTareaNueva", () => {
  it("un editor crea una tarea pendiente con autor y fecha del servidor", () => {
    const entrada = {
      titulo: "Maqueta",
      prioridad: "alta",
      vence: "2026-12-01",
    };
    expect(crear("u2", { ...entrada, responsableUid: "u3" })).toEqual({
      ...tarea,
      prioridad: "alta",
      vence: "2026-12-01",
      responsableUid: "u3",
      creadaPor: "u2",
    });
  });

  it("un lector no puede crear tareas (403)", () => {
    expect(errorDe(() => crear("u3", { titulo: "Ok" })).status).toBe(403);
  });

  it("quien no es miembro recibe 404", () => {
    expect(errorDe(() => crear("nadie", { titulo: "Ok" })).status).toBe(404);
  });

  it("valida la entrada con detalles por campo (400)", () => {
    const error = errorDe(() => crear("u2", { titulo: "", estado: "hecha" }));
    expect(error.status).toBe(400);
    expect(error.detalles.map((d) => d.campo)).toContain("titulo");
  });

  it("el responsable debe ser miembro del proyecto (400)", () => {
    const error = errorDe(() =>
      crear("u2", { titulo: "Ok", responsableUid: "externo" }),
    );
    expect(error.status).toBe(400);
    expect(error.detalles[0]?.campo).toBe("responsableUid");
  });
});

describe("aplicarCambiosTarea", () => {
  it("un editor cambia el estado sin tocar el resto", () => {
    expect(editar("u2", { estado: "hecha" })).toEqual({
      ...tarea,
      estado: "hecha",
    });
  });

  it("permite asignar y quitar el responsable", () => {
    expect(editar("u1", { responsableUid: "u3" }).responsableUid).toBe("u3");
    expect(editar("u1", { responsableUid: null }).responsableUid).toBeNull();
  });

  it("un lector no puede editar (403) y quien no es miembro recibe 404", () => {
    expect(errorDe(() => editar("u3", { estado: "hecha" })).status).toBe(403);
    expect(errorDe(() => editar("nadie", { estado: "hecha" })).status).toBe(
      404,
    );
  });

  it("rechaza cambios inválidos o un responsable externo (400)", () => {
    expect(errorDe(() => editar("u2", {})).status).toBe(400);
    expect(errorDe(() => editar("u2", { creadaPor: "u2" })).status).toBe(400);
    const error = errorDe(() => editar("u2", { responsableUid: "externo" }));
    expect(error.detalles[0]?.campo).toBe("responsableUid");
  });
});
