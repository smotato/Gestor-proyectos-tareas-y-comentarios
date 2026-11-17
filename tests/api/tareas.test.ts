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
const repo = vi.hoisted(() => ({
  listarTareas: vi.fn(),
  nuevoIdTarea: vi.fn(),
  guardarTareaNueva: vi.fn(),
}));
vi.mock("@/repositories/tareas", () => repo);
const actividad = vi.hoisted(() => ({ nuevoIdActividad: vi.fn() }));
vi.mock("@/repositories/actividad", () => actividad);

import { GET, POST } from "@/app/api/proyectos/[id]/tareas/route";
import {
  conParams,
  peticionJson,
  proyectoDePrueba,
  tareaDePrueba,
} from "./simulaciones";

const RUTA = "/api/proyectos/p1/tareas";

function crear(uid: string | null, cuerpo: unknown) {
  sesion.uid = uid;
  return POST(peticionJson(RUTA, "POST", cuerpo), conParams({ id: "p1" }));
}

function listar(uid: string, consulta = "") {
  sesion.uid = uid;
  const peticion = new Request(`http://localhost:3000${RUTA}${consulta}`);
  return GET(peticion, conParams({ id: "p1" }));
}

beforeEach(() => {
  vi.resetAllMocks();
  proyectos.obtenerProyecto.mockResolvedValue(proyectoDePrueba());
  repo.nuevoIdTarea.mockReturnValue("t9");
  actividad.nuevoIdActividad.mockReturnValue("a1");
});

describe("POST /api/proyectos/:id/tareas · permisos", () => {
  it("un lector que intenta crear una tarea recibe 403", async () => {
    const respuesta = await crear("u3", { titulo: "Maqueta" });
    expect(respuesta.status).toBe(403);
    expect(repo.guardarTareaNueva).not.toHaveBeenCalled();
  });

  it("quien no es miembro recibe 404 y sin sesión 401", async () => {
    expect((await crear("u9", { titulo: "Maqueta" })).status).toBe(404);
    expect((await crear(null, { titulo: "Maqueta" })).status).toBe(401);
    expect(repo.guardarTareaNueva).not.toHaveBeenCalled();
  });

  it("un editor crea la tarea: pendiente, con su uid como autor (201)", async () => {
    const respuesta = await crear("u2", {
      titulo: " Maqueta ",
      prioridad: "alta",
    });
    expect(respuesta.status).toBe(201);
    expect(respuesta.headers.get("location")).toBe(`${RUTA}/t9`);
    expect(repo.guardarTareaNueva).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        id: "t9",
        titulo: "Maqueta",
        prioridad: "alta",
        estado: "pendiente",
        creadaPor: "u2",
      }),
      expect.objectContaining({
        id: "a1",
        uid: "u2",
        accion: "tareaCreada",
        detalle: "Creó la tarea «Maqueta»",
      }),
    );
  });
});

describe("POST /api/proyectos/:id/tareas · validación", () => {
  it("sin título responde 400 con el detalle del campo", async () => {
    const respuesta = await crear("u2", { titulo: "  " });
    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({
      detalles: [{ campo: "titulo" }],
    });
  });

  it("rechaza que el cliente decida el estado o el autor (400)", async () => {
    expect((await crear("u2", { titulo: "Ok", estado: "hecha" })).status).toBe(
      400,
    );
    expect((await crear("u2", { titulo: "Ok", creadaPor: "u1" })).status).toBe(
      400,
    );
    expect(repo.guardarTareaNueva).not.toHaveBeenCalled();
  });

  it("el responsable debe ser miembro del proyecto (400)", async () => {
    const respuesta = await crear("u2", { titulo: "Ok", responsableUid: "u9" });
    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({
      detalles: [{ campo: "responsableUid" }],
    });
  });
});

describe("GET /api/proyectos/:id/tareas", () => {
  const pagina = { items: [tareaDePrueba()], siguienteCursor: null };

  it("un lector puede ver la lista (200)", async () => {
    repo.listarTareas.mockResolvedValue(pagina);
    const respuesta = await listar("u3");
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual(pagina);
  });

  it("pasa los filtros al repositorio y 'mias' usa el uid de la sesión", async () => {
    repo.listarTareas.mockResolvedValue(pagina);
    await listar("u3", "?estado=hecha&mias=1");
    expect(repo.listarTareas).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ estado: "hecha", responsableUid: "u3" }),
    );
  });

  it("filtra por responsable y rechaza parámetros inválidos (400)", async () => {
    repo.listarTareas.mockResolvedValue(pagina);
    await listar("u1", "?responsable=u2");
    expect(repo.listarTareas).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ responsableUid: "u2" }),
    );
    expect((await listar("u1", "?estado=zzz")).status).toBe(400);
    expect((await listar("u1", "?limite=500")).status).toBe(400);
  });

  it("quien no es miembro recibe 404", async () => {
    expect((await listar("u9")).status).toBe(404);
    expect(repo.listarTareas).not.toHaveBeenCalled();
  });
});
