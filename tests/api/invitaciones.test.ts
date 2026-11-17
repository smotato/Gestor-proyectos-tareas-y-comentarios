// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Invitacion } from "@/schemas/invitacion";
import type { Proyecto } from "@/schemas/proyecto";

const sesion = vi.hoisted((): { uid: string | null } => ({ uid: "u1" }));
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
const almacen = vi.hoisted(
  (): { invitacion: Invitacion | null; proyecto: Proyecto | null } => ({
    invitacion: null,
    proyecto: null,
  }),
);
const repo = vi.hoisted(() => ({
  guardarInvitacionNueva: vi.fn(),
  obtenerInvitacion: vi.fn(),
  aceptarInvitacion: vi.fn(),
}));
vi.mock("@/repositories/invitaciones", () => repo);

import { POST as aceptar } from "@/app/api/invitaciones/[codigo]/aceptar/route";
import { POST as crear } from "@/app/api/proyectos/[id]/invitaciones/route";
import { DURACION_INVITACION_MS } from "@/services/invitaciones";
import { conParams, peticionJson, proyectoDePrueba } from "./simulaciones";

const FUTURO = "2099-01-01T00:00:00.000Z";
const PASADO = "2020-01-01T00:00:00.000Z";

function invitacion(cambios: Partial<Invitacion> = {}): Invitacion {
  return {
    codigo: "abc123",
    proyectoId: "p1",
    rol: "editor",
    expira: FUTURO,
    usada: false,
    ...cambios,
  };
}

/** Como la transacción real: si `decidir` lanza, no se guarda nada. */
function simularTransaccion() {
  repo.aceptarInvitacion.mockImplementation(
    async (
      _codigo: string,
      decidir: (i: Invitacion | null, p: Proyecto | null) => Proyecto,
    ) => {
      const nuevo = decidir(almacen.invitacion, almacen.proyecto);
      almacen.proyecto = nuevo;
      almacen.invitacion = almacen.invitacion && {
        ...almacen.invitacion,
        usada: true,
      };
      return nuevo;
    },
  );
}

function generar(uid: string | null, cuerpo: unknown) {
  sesion.uid = uid;
  const peticion = peticionJson(
    "/api/proyectos/p1/invitaciones",
    "POST",
    cuerpo,
  );
  return crear(peticion, conParams({ id: "p1" }));
}

function aceptarComo(uid: string | null, codigo = "abc123") {
  sesion.uid = uid;
  const peticion = peticionJson(`/api/invitaciones/${codigo}/aceptar`, "POST");
  return aceptar(peticion, conParams({ codigo }));
}

beforeEach(() => {
  vi.resetAllMocks();
  proyectos.obtenerProyecto.mockResolvedValue(proyectoDePrueba());
  almacen.invitacion = invitacion();
  almacen.proyecto = proyectoDePrueba();
  simularTransaccion();
});

describe("POST /api/proyectos/:id/invitaciones · generar el código", () => {
  it("el propietario crea una invitación que vence a los 7 días (201)", async () => {
    const respuesta = await generar("u1", { rol: "editor" });
    expect(respuesta.status).toBe(201);
    const { invitacion: creada }: { invitacion: Invitacion } =
      await respuesta.json();
    expect(creada).toMatchObject({
      proyectoId: "p1",
      rol: "editor",
      usada: false,
    });
    expect(creada.codigo).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const duracion = Date.parse(creada.expira) - Date.now();
    expect(Math.abs(duracion - DURACION_INVITACION_MS)).toBeLessThan(60_000);
    expect(repo.guardarInvitacionNueva).toHaveBeenCalledWith(creada);
  });

  it("un editor o un lector que intenta invitar recibe 403", async () => {
    expect((await generar("u2", { rol: "lector" })).status).toBe(403);
    expect((await generar("u3", { rol: "lector" })).status).toBe(403);
    expect(repo.guardarInvitacionNueva).not.toHaveBeenCalled();
  });

  it("quien no es miembro recibe 404 y sin sesión 401", async () => {
    expect((await generar("u9", { rol: "lector" })).status).toBe(404);
    expect((await generar(null, { rol: "lector" })).status).toBe(401);
  });

  it("valida el rol y no deja que el cliente decida otros campos (400)", async () => {
    expect((await generar("u1", { rol: "propietario" })).status).toBe(400);
    expect((await generar("u1", {})).status).toBe(400);
    const extra = await generar("u1", { rol: "lector", usada: true });
    expect(extra.status).toBe(400);
    expect(repo.guardarInvitacionNueva).not.toHaveBeenCalled();
  });
});

describe("POST /api/invitaciones/:codigo/aceptar · aceptar", () => {
  it("agrega a quien acepta con el rol y marca la invitación como usada", async () => {
    const respuesta = await aceptarComo("u9");
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ proyectoId: "p1", rol: "editor" });
    expect(almacen.proyecto?.miembros.u9).toBe("editor");
    expect(almacen.proyecto?.miembrosUids).toContain("u9");
    expect(almacen.invitacion?.usada).toBe(true);
  });

  it("una invitación usada da 409: no se puede aceptar dos veces", async () => {
    expect((await aceptarComo("u9")).status).toBe(200);
    const segunda = await aceptarComo("u8");
    expect(segunda.status).toBe(409);
    expect(await segunda.json()).toEqual({
      error: "Esta invitación ya fue usada",
    });
    expect(almacen.proyecto?.miembros.u8).toBeUndefined();
  });

  it("una invitación vencida da 410 y no se gasta", async () => {
    almacen.invitacion = invitacion({ expira: PASADO });
    const respuesta = await aceptarComo("u9");
    expect(respuesta.status).toBe(410);
    expect(await respuesta.json()).toEqual({ error: "Esta invitación venció" });
    expect(almacen.invitacion?.usada).toBe(false);
    expect(almacen.proyecto?.miembros.u9).toBeUndefined();
  });

  it("si es usada y además vencida responde 409", async () => {
    almacen.invitacion = invitacion({ usada: true, expira: PASADO });
    expect((await aceptarComo("u9")).status).toBe(409);
  });

  it("quien ya es miembro recibe 409 y la invitación sigue sin usar", async () => {
    const respuesta = await aceptarComo("u3");
    expect(respuesta.status).toBe(409);
    expect(almacen.invitacion?.usada).toBe(false);
    expect(almacen.proyecto?.miembros.u3).toBe("lector");
  });
});

describe("POST /api/invitaciones/:codigo/aceptar · errores", () => {
  it("un código inexistente o un proyecto eliminado dan 404", async () => {
    almacen.invitacion = null;
    expect((await aceptarComo("u9")).status).toBe(404);
    almacen.invitacion = invitacion();
    almacen.proyecto = null;
    expect((await aceptarComo("u9")).status).toBe(404);
  });

  it("un código con formato inválido da 404 sin consultar la base", async () => {
    expect((await aceptarComo("u9", "a.b")).status).toBe(404);
    expect(repo.aceptarInvitacion).not.toHaveBeenCalled();
  });

  it("sin sesión responde 401 y con un Origin ajeno 403", async () => {
    expect((await aceptarComo(null)).status).toBe(401);
    sesion.uid = "u9";
    const ajena = new Request(
      "http://localhost:3000/api/invitaciones/abc123/aceptar",
      {
        method: "POST",
        headers: { origin: "https://malo.com" },
      },
    );
    const respuesta = await aceptar(ajena, conParams({ codigo: "abc123" }));
    expect(respuesta.status).toBe(403);
    expect(almacen.invitacion?.usada).toBe(false);
  });
});
