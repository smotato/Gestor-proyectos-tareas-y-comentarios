// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const sesion = vi.hoisted((): { uid: string | null } => ({ uid: "u3" }));
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
const actividad = vi.hoisted(() => ({ listarActividad: vi.fn() }));
vi.mock("@/repositories/actividad", () => actividad);

import { GET } from "@/app/api/proyectos/[id]/actividad/route";
import { conParams, proyectoDePrueba } from "./simulaciones";

const registro = {
  id: "a1",
  uid: "u2",
  accion: "estadoCambiado",
  detalle: "Cambió el estado de «Maqueta» de Pendiente a Hecha",
  creadoEn: "2026-11-16T10:00:00.000Z",
};

function pedir(uid: string | null, consulta = "") {
  sesion.uid = uid;
  const peticion = new Request(
    `http://localhost:3000/api/proyectos/p1/actividad${consulta}`,
  );
  return GET(peticion, conParams({ id: "p1" }));
}

beforeEach(() => {
  vi.resetAllMocks();
  proyectos.obtenerProyecto.mockResolvedValue(proyectoDePrueba());
});

describe("GET /api/proyectos/:id/actividad", () => {
  it("un lector ve el registro (200) con limite 20 por defecto", async () => {
    const pagina = { items: [registro], siguienteCursor: null };
    actividad.listarActividad.mockResolvedValue(pagina);
    const respuesta = await pedir("u3");
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual(pagina);
    expect(actividad.listarActividad).toHaveBeenCalledWith("p1", 20, undefined);
  });

  it("pasa limite y cursor al repositorio", async () => {
    actividad.listarActividad.mockResolvedValue({
      items: [],
      siguienteCursor: null,
    });
    await pedir("u1", "?limite=50&cursor=a7");
    expect(actividad.listarActividad).toHaveBeenCalledWith("p1", 50, "a7");
  });

  it("valida limite y cursor (400)", async () => {
    expect((await pedir("u3", "?limite=0")).status).toBe(400);
    expect((await pedir("u3", "?limite=101")).status).toBe(400);
    expect((await pedir("u3", "?cursor=a/b")).status).toBe(400);
    expect((await pedir("u3", "?otro=1")).status).toBe(400);
    expect(actividad.listarActividad).not.toHaveBeenCalled();
  });

  it("quien no es miembro recibe 404 y sin sesión 401", async () => {
    expect((await pedir("u9")).status).toBe(404);
    expect((await pedir(null)).status).toBe(401);
    expect(actividad.listarActividad).not.toHaveBeenCalled();
  });
});
