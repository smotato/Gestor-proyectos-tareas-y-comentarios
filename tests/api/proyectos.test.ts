// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const sesion = vi.hoisted(() => ({ uid: "u1" as string | null }));
vi.mock("@/lib/auth", async () => {
  const { noAutenticado } = await import("@/lib/errores");
  return {
    requerirUsuario: async () => {
      if (!sesion.uid) throw noAutenticado();
      return { uid: sesion.uid, correo: null, rol: null };
    },
  };
});
const repo = vi.hoisted(() => ({
  obtenerProyecto: vi.fn(),
  listarProyectosDeMiembro: vi.fn(),
  guardarProyectoNuevo: vi.fn(),
  nuevoIdProyecto: vi.fn(),
  modificarMembresia: vi.fn(),
}));
vi.mock("@/repositories/proyectos", () => repo);
vi.mock("@/repositories/usuarios", () => ({ correosPorUid: vi.fn() }));

import { GET as obtener } from "@/app/api/proyectos/[id]/route";
import { GET as listar, POST as crear } from "@/app/api/proyectos/route";
import { conParams, peticionJson, proyectoDePrueba } from "./simulaciones";

const listarCon = (consulta = "") =>
  listar(new Request(`http://localhost:3000/api/proyectos${consulta}`), {});
const obtenerComo = (uid: string, id = "p1") => {
  sesion.uid = uid;
  return obtener(
    new Request(`http://localhost/api/proyectos/${id}`),
    conParams({ id }),
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  sesion.uid = "u1";
});

describe("GET /api/proyectos", () => {
  it("sin sesión responde 401", async () => {
    sesion.uid = null;
    expect((await listarCon()).status).toBe(401);
  });

  it("lista solo los proyectos del usuario de la sesión", async () => {
    repo.listarProyectosDeMiembro.mockResolvedValue({
      items: [proyectoDePrueba()],
      siguienteCursor: null,
    });
    const respuesta = await listarCon("?limite=5");
    expect(respuesta.status).toBe(200);
    expect(repo.listarProyectosDeMiembro).toHaveBeenCalledWith(
      "u1",
      5,
      undefined,
    );
    expect(await respuesta.json()).toEqual({
      items: [
        {
          id: "p1",
          nombre: "Tablero de clase",
          creadoEn: "2026-11-16T10:00:00.000Z",
          rol: "propietario",
          totalMiembros: 3,
        },
      ],
      siguienteCursor: null,
    });
  });

  it("valida limite (máx. 100) y cursor con 400", async () => {
    expect((await listarCon("?limite=500")).status).toBe(400);
    expect((await listarCon("?cursor=a/b")).status).toBe(400);
    expect(repo.listarProyectosDeMiembro).not.toHaveBeenCalled();
  });
});

describe("POST /api/proyectos", () => {
  it("crea el proyecto con quien lo pide como único propietario (201)", async () => {
    repo.nuevoIdProyecto.mockReturnValue("nuevo");
    const respuesta = await crear(
      peticionJson("/api/proyectos", "POST", { nombre: "  Feria " }),
      {},
    );
    expect(respuesta.status).toBe(201);
    expect(respuesta.headers.get("location")).toBe("/api/proyectos/nuevo");
    expect(repo.guardarProyectoNuevo).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "nuevo",
        nombre: "Feria",
        propietarioUid: "u1",
        miembros: { u1: "propietario" },
        miembrosUids: ["u1"],
      }),
    );
  });
});

describe("POST /api/proyectos · 400 y 401", () => {
  it("sin nombre (o con nombre vacío) responde 400 con el detalle del campo", async () => {
    for (const cuerpo of [{}, { nombre: "   " }]) {
      const respuesta = await crear(
        peticionJson("/api/proyectos", "POST", cuerpo),
        {},
      );
      expect(respuesta.status).toBe(400);
      expect(await respuesta.json()).toMatchObject({
        detalles: [{ campo: "nombre" }],
      });
    }
    expect(repo.guardarProyectoNuevo).not.toHaveBeenCalled();
  });

  it("sin sesión responde 401 y no crea nada", async () => {
    sesion.uid = null;
    const cuerpo = { nombre: "Feria" };
    const respuesta = await crear(
      peticionJson("/api/proyectos", "POST", cuerpo),
      {},
    );
    expect(respuesta.status).toBe(401);
    expect(repo.guardarProyectoNuevo).not.toHaveBeenCalled();
  });

  it("rechaza que el cliente mande el propietario o los miembros (400)", async () => {
    const cuerpo = { nombre: "Feria", miembros: { atacante: "propietario" } };
    const respuesta = await crear(
      peticionJson("/api/proyectos", "POST", cuerpo),
      {},
    );
    expect(respuesta.status).toBe(400);
    expect(repo.guardarProyectoNuevo).not.toHaveBeenCalled();
  });
});

describe("GET /api/proyectos/:id", () => {
  it("quien no es miembro recibe 404 (no se revela que existe)", async () => {
    repo.obtenerProyecto.mockResolvedValue(proyectoDePrueba());
    const respuesta = await obtenerComo("u9");
    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "Proyecto no encontrado" });
  });

  it("un proyecto inexistente o un id inválido también dan 404", async () => {
    repo.obtenerProyecto.mockResolvedValue(null);
    expect((await obtenerComo("u1", "nada")).status).toBe(404);
    expect((await obtenerComo("u1", "a.b")).status).toBe(404);
    expect(repo.obtenerProyecto).toHaveBeenCalledTimes(1);
  });

  it("un miembro recibe el proyecto y su rol", async () => {
    repo.obtenerProyecto.mockResolvedValue(proyectoDePrueba());
    const respuesta = await obtenerComo("u3");
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({
      proyecto: { id: "p1" },
      rol: "lector",
    });
  });
});
