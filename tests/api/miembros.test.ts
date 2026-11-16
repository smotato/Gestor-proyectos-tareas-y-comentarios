// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Proyecto } from "@/schemas/proyecto";

const sesion = vi.hoisted(() => ({ uid: "u1" }));
vi.mock("@/lib/auth", () => ({
  requerirUsuario: async () => ({ uid: sesion.uid, correo: null, rol: null }),
}));
const repo = vi.hoisted(() => ({
  obtenerProyecto: vi.fn(),
  modificarMembresia: vi.fn(),
}));
vi.mock("@/repositories/proyectos", () => repo);
vi.mock("@/repositories/usuarios", () => ({
  correosPorUid: async () => new Map([["u1", "ana@ejemplo.com"]]),
}));

import { GET as listar } from "@/app/api/proyectos/[id]/miembros/route";
import {
  DELETE as quitar,
  PATCH as cambiar,
} from "@/app/api/proyectos/[id]/miembros/[uid]/route";
import { conParams, peticionJson, proyectoDePrueba } from "./simulaciones";

/** Simula la transacción: aplica el cambio sobre el proyecto guardado. */
function usarProyecto(proyecto: Proyecto) {
  repo.obtenerProyecto.mockResolvedValue(proyecto);
  repo.modificarMembresia.mockImplementation(
    async (_id: string, cambio: (p: Proyecto | null) => Proyecto) =>
      cambio(proyecto),
  );
}

function cambiarRol(actor: string, objetivo: string, cuerpo: unknown) {
  sesion.uid = actor;
  const ruta = `/api/proyectos/p1/miembros/${objetivo}`;
  return cambiar(
    peticionJson(ruta, "PATCH", cuerpo),
    conParams({ id: "p1", uid: objetivo }),
  );
}

function quitarMiembro(actor: string, objetivo: string) {
  sesion.uid = actor;
  const ruta = `/api/proyectos/p1/miembros/${objetivo}`;
  return quitar(
    peticionJson(ruta, "DELETE"),
    conParams({ id: "p1", uid: objetivo }),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  usarProyecto(proyectoDePrueba());
});

describe("PATCH /api/proyectos/:id/miembros/:uid · permisos", () => {
  it("un editor que intenta cambiar roles recibe 403", async () => {
    const respuesta = await cambiarRol("u2", "u3", { rol: "editor" });
    expect(respuesta.status).toBe(403);
    expect(repo.modificarMembresia).not.toHaveBeenCalled();
  });

  it("un lector recibe 403 y quien no es miembro 404", async () => {
    expect((await cambiarRol("u3", "u2", { rol: "lector" })).status).toBe(403);
    expect((await cambiarRol("u9", "u2", { rol: "lector" })).status).toBe(404);
  });

  it("valida el rol (400) y el miembro objetivo (404)", async () => {
    expect((await cambiarRol("u1", "u2", { rol: "admin" })).status).toBe(400);
    expect((await cambiarRol("u1", "u9", { rol: "lector" })).status).toBe(404);
  });
});

describe("PATCH /api/proyectos/:id/miembros/:uid · último propietario", () => {
  it("el propietario cambia el rol de un miembro (200)", async () => {
    const respuesta = await cambiarRol("u1", "u3", { rol: "editor" });
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({
      proyecto: { miembros: { u3: "editor" } },
    });
  });

  it("no se puede degradar al último propietario (409)", async () => {
    expect((await cambiarRol("u1", "u1", { rol: "editor" })).status).toBe(409);
  });

  it("si el propietario principal deja de serlo, pasa a otro propietario", async () => {
    usarProyecto(
      proyectoDePrueba({
        miembros: { u1: "propietario", u4: "propietario" },
        miembrosUids: ["u1", "u4"],
      }),
    );
    const respuesta = await cambiarRol("u1", "u1", { rol: "editor" });
    expect(await respuesta.json()).toMatchObject({
      proyecto: { propietarioUid: "u4", miembros: { u1: "editor" } },
    });
  });
});

describe("DELETE /api/proyectos/:id/miembros/:uid", () => {
  it("el propietario quita a un miembro (204)", async () => {
    expect((await quitarMiembro("u1", "u3")).status).toBe(204);
    const cambio = repo.modificarMembresia.mock.calls[0]?.[1];
    expect(cambio?.(proyectoDePrueba()).miembrosUids).toEqual(["u1", "u2"]);
  });

  it("no se puede quitar al último propietario (409) ni a quien no es miembro (404)", async () => {
    expect((await quitarMiembro("u1", "u1")).status).toBe(409);
    expect((await quitarMiembro("u1", "u9")).status).toBe(404);
  });

  it("un editor no puede quitar miembros (403)", async () => {
    expect((await quitarMiembro("u2", "u3")).status).toBe(403);
  });
});

describe("GET /api/proyectos/:id/miembros", () => {
  it("cualquier miembro ve la lista con correos, propietarios primero", async () => {
    sesion.uid = "u3";
    const respuesta = await listar(
      new Request("http://localhost/api/proyectos/p1/miembros"),
      conParams({ id: "p1" }),
    );
    expect(await respuesta.json()).toEqual({
      rol: "lector",
      items: [
        { uid: "u1", rol: "propietario", correo: "ana@ejemplo.com" },
        { uid: "u2", rol: "editor", correo: null },
        { uid: "u3", rol: "lector", correo: null },
      ],
    });
  });
});
