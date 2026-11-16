// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Tarea } from "@/schemas/tarea";

const sesion = vi.hoisted((): { uid: string } => ({ uid: "u2" }));
vi.mock("@/lib/auth", () => ({
  requerirUsuario: async () => ({ uid: sesion.uid, correo: null, rol: null }),
}));
const proyectos = vi.hoisted(() => ({ obtenerProyecto: vi.fn() }));
vi.mock("@/repositories/proyectos", () => proyectos);
vi.mock("@/repositories/usuarios", () => ({ correosPorUid: vi.fn() }));
const repo = vi.hoisted(() => ({
  obtenerTarea: vi.fn(),
  modificarTarea: vi.fn(),
  eliminarTarea: vi.fn(),
}));
vi.mock("@/repositories/tareas", () => repo);

import {
  DELETE,
  GET,
  PATCH,
} from "@/app/api/proyectos/[id]/tareas/[tid]/route";
import {
  conParams,
  peticionJson,
  proyectoDePrueba,
  tareaDePrueba,
} from "./simulaciones";

const RUTA = "/api/proyectos/p1/tareas/t1";
const contexto = (tid = "t1") => conParams({ id: "p1", tid });

/** Simula la transacción sobre la tarea guardada (o sobre una que no existe). */
function guardada(tarea: Tarea | null) {
  repo.obtenerTarea.mockResolvedValue(tarea);
  repo.modificarTarea.mockImplementation(
    async (_p: string, _id: string, cambio: (t: Tarea | null) => Tarea) =>
      cambio(tarea),
  );
}

function editar(uid: string, cambios: unknown, tid = "t1") {
  sesion.uid = uid;
  return PATCH(peticionJson(RUTA, "PATCH", cambios), contexto(tid));
}

function borrar(uid: string, tid = "t1") {
  sesion.uid = uid;
  return DELETE(peticionJson(RUTA, "DELETE"), contexto(tid));
}

beforeEach(() => {
  vi.resetAllMocks();
  proyectos.obtenerProyecto.mockResolvedValue(proyectoDePrueba());
  guardada(tareaDePrueba());
});

describe("GET /api/proyectos/:id/tareas/:tid", () => {
  it("un lector ve la tarea (200); una inexistente o id inválido, 404", async () => {
    sesion.uid = "u3";
    const peticion = new Request(`http://localhost:3000${RUTA}`);
    const respuesta = await GET(peticion, contexto());
    expect(await respuesta.json()).toEqual({ tarea: tareaDePrueba() });
    guardada(null);
    expect((await GET(peticion, contexto())).status).toBe(404);
    expect((await GET(peticion, contexto("a.b"))).status).toBe(404);
  });
});

describe("PATCH /api/proyectos/:id/tareas/:tid", () => {
  it("un lector que intenta editar recibe 403", async () => {
    expect((await editar("u3", { estado: "hecha" })).status).toBe(403);
    expect(repo.modificarTarea).not.toHaveBeenCalled();
  });

  it("quien no es miembro recibe 404", async () => {
    expect((await editar("u9", { estado: "hecha" })).status).toBe(404);
  });

  it("un editor cambia el estado sin tocar el resto (200)", async () => {
    const respuesta = await editar("u2", { estado: "hecha" });
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      tarea: tareaDePrueba({ estado: "hecha" }),
    });
  });

  it("valida los cambios (400) y responde 404 si la tarea no existe", async () => {
    expect((await editar("u2", {})).status).toBe(400);
    expect((await editar("u2", { creadaPor: "u2" })).status).toBe(400);
    expect((await editar("u2", { responsableUid: "u9" })).status).toBe(400);
    guardada(null);
    expect((await editar("u2", { estado: "hecha" })).status).toBe(404);
  });
});

describe("DELETE /api/proyectos/:id/tareas/:tid", () => {
  it("un lector recibe 403 y la tarea no se borra", async () => {
    expect((await borrar("u3")).status).toBe(403);
    expect(repo.eliminarTarea).not.toHaveBeenCalled();
  });

  it("editor y propietario eliminan la tarea (204)", async () => {
    expect((await borrar("u2")).status).toBe(204);
    expect((await borrar("u1")).status).toBe(204);
    expect(repo.eliminarTarea).toHaveBeenCalledWith("p1", "t1");
  });

  it("una tarea inexistente responde 404", async () => {
    guardada(null);
    expect((await borrar("u2")).status).toBe(404);
    expect(repo.eliminarTarea).not.toHaveBeenCalled();
  });
});
