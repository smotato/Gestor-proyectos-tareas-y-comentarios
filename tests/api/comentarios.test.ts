// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const sesion = vi.hoisted((): { uid: string | null } => ({ uid: "u2" }));
vi.mock("@/lib/auth", async () => {
  const { noAutenticado } = await import("@/lib/errores");
  return {
    requerirUsuario: async () => {
      if (!sesion.uid) throw noAutenticado();
      return { uid: sesion.uid, correo: null, rol: null };
    },
  };
});
const proyectos = vi.hoisted(() => ({ obtenerProyecto: vi.fn() }));
vi.mock("@/repositories/proyectos", () => proyectos);
vi.mock("@/repositories/usuarios", () => ({ correosPorUid: vi.fn() }));
const tareas = vi.hoisted(() => ({ obtenerTarea: vi.fn() }));
vi.mock("@/repositories/tareas", () => tareas);
const comentarios = vi.hoisted(() => ({
  nuevoIdComentario: vi.fn(),
  guardarComentarioNuevo: vi.fn(),
  listarComentarios: vi.fn(),
}));
vi.mock("@/repositories/comentarios", () => comentarios);
const actividad = vi.hoisted(() => ({ nuevoIdActividad: vi.fn() }));
vi.mock("@/repositories/actividad", () => actividad);

import {
  GET,
  POST,
} from "@/app/api/proyectos/[id]/tareas/[tid]/comentarios/route";
import {
  conParams,
  peticionJson,
  proyectoDePrueba,
  tareaDePrueba,
} from "./simulaciones";

const RUTA = "/api/proyectos/p1/tareas/t1/comentarios";
const contexto = (tid = "t1") => conParams({ id: "p1", tid });

function comentar(uid: string | null, cuerpo: unknown, tid = "t1") {
  sesion.uid = uid;
  return POST(peticionJson(RUTA, "POST", cuerpo), contexto(tid));
}

function listar(uid: string, consulta = "", tid = "t1") {
  sesion.uid = uid;
  const peticion = new Request(`http://localhost:3000${RUTA}${consulta}`);
  return GET(peticion, contexto(tid));
}

beforeEach(() => {
  vi.resetAllMocks();
  proyectos.obtenerProyecto.mockResolvedValue(proyectoDePrueba());
  tareas.obtenerTarea.mockResolvedValue(tareaDePrueba());
  comentarios.nuevoIdComentario.mockReturnValue("c9");
  actividad.nuevoIdActividad.mockReturnValue("a1");
});

describe("POST /api/proyectos/:id/tareas/:tid/comentarios · permisos", () => {
  it("un lector que intenta comentar recibe 403", async () => {
    const respuesta = await comentar("u3", { texto: "Hola" });
    expect(respuesta.status).toBe(403);
    expect(comentarios.guardarComentarioNuevo).not.toHaveBeenCalled();
  });

  it("quien no es miembro recibe 404 y sin sesión 401", async () => {
    expect((await comentar("u9", { texto: "Hola" })).status).toBe(404);
    expect((await comentar(null, { texto: "Hola" })).status).toBe(401);
  });

  it("una tarea inexistente responde 404", async () => {
    tareas.obtenerTarea.mockResolvedValue(null);
    expect((await comentar("u2", { texto: "Hola" })).status).toBe(404);
    expect((await comentar("u2", { texto: "Hola" }, "a.b")).status).toBe(404);
  });
});

describe("POST /api/proyectos/:id/tareas/:tid/comentarios · crear", () => {
  it("un editor comenta: el autor sale de la sesión y queda en la actividad", async () => {
    const respuesta = await comentar("u2", { texto: " Ya subí la maqueta " });
    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toMatchObject({
      comentario: { id: "c9", uid: "u2", texto: "Ya subí la maqueta" },
    });
    expect(comentarios.guardarComentarioNuevo).toHaveBeenCalledWith(
      "p1",
      "t1",
      expect.objectContaining({ id: "c9", uid: "u2" }),
      expect.objectContaining({
        uid: "u2",
        accion: "comentarioCreado",
        detalle: "Comentó en «Maqueta»",
      }),
    );
  });

  it("valida el texto y rechaza que el cliente mande el autor (400)", async () => {
    const vacio = await comentar("u2", { texto: "  " });
    expect(vacio.status).toBe(400);
    expect(await vacio.json()).toMatchObject({
      detalles: [{ campo: "texto" }],
    });
    expect((await comentar("u2", { texto: "Hola", uid: "u1" })).status).toBe(
      400,
    );
    expect(comentarios.guardarComentarioNuevo).not.toHaveBeenCalled();
  });
});

describe("GET /api/proyectos/:id/tareas/:tid/comentarios", () => {
  const pagina = { items: [], siguienteCursor: "c3" };

  it("un lector lee la lista y se pasan limite y cursor al repositorio", async () => {
    comentarios.listarComentarios.mockResolvedValue(pagina);
    const respuesta = await listar("u3", "?limite=5&cursor=c1");
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual(pagina);
    expect(comentarios.listarComentarios).toHaveBeenCalledWith(
      "p1",
      "t1",
      5,
      "c1",
    );
  });

  it("limite máximo 100, cursor válido y tarea existente (400/404)", async () => {
    expect((await listar("u3", "?limite=101")).status).toBe(400);
    expect((await listar("u3", "?cursor=a/b")).status).toBe(400);
    tareas.obtenerTarea.mockResolvedValue(null);
    expect((await listar("u3")).status).toBe(404);
    expect(comentarios.listarComentarios).not.toHaveBeenCalled();
  });

  it("quien no es miembro recibe 404", async () => {
    expect((await listar("u9")).status).toBe(404);
  });
});
