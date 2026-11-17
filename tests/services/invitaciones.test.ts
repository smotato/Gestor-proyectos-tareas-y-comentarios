import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Invitacion } from "@/schemas/invitacion";

const invitaciones = vi.hoisted(() => ({
  obtenerInvitacion: vi.fn(),
  guardarInvitacionNueva: vi.fn(),
  aceptarInvitacion: vi.fn(),
}));
vi.mock("@/repositories/invitaciones", () => invitaciones);
const proyectos = vi.hoisted(() => ({ obtenerProyecto: vi.fn() }));
vi.mock("@/repositories/proyectos", () => proyectos);

import {
  aplicarInvitacion,
  crearInvitacion,
  describirInvitacion,
  DURACION_INVITACION_MS,
} from "@/services/invitaciones";
import { proyectoDePrueba } from "../api/simulaciones";
import { capturarErrorHttp } from "../ayudas";

const ahora = new Date("2026-11-16T10:00:00.000Z");
const proyecto = proyectoDePrueba();

function invitacion(cambios: Partial<Invitacion> = {}): Invitacion {
  return {
    codigo: "abc123",
    proyectoId: "p1",
    rol: "editor",
    expira: "2026-11-20T10:00:00.000Z",
    usada: false,
    ...cambios,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  proyectos.obtenerProyecto.mockResolvedValue(proyecto);
});

describe("aplicarInvitacion", () => {
  it("agrega a quien acepta con el rol de la invitación", () => {
    const nuevo = aplicarInvitacion(invitacion(), proyecto, "u9", ahora);
    expect(nuevo.miembros.u9).toBe("editor");
    expect(nuevo.miembrosUids).toEqual(["u1", "u2", "u3", "u9"]);
    expect(nuevo.propietarioUid).toBe("u1");
  });

  it("una invitación usada da 409 y una vencida 410", () => {
    const usada = invitacion({ usada: true });
    const vencida = invitacion({ expira: "2026-11-10T10:00:00.000Z" });
    expect(
      capturarErrorHttp(() => aplicarInvitacion(usada, proyecto, "u9", ahora))
        .status,
    ).toBe(409);
    expect(
      capturarErrorHttp(() => aplicarInvitacion(vencida, proyecto, "u9", ahora))
        .status,
    ).toBe(410);
  });

  it("usada y vencida a la vez da 409, y vence justo en la hora de expiración", () => {
    const ambas = invitacion({
      usada: true,
      expira: "2026-11-10T10:00:00.000Z",
    });
    const justo = invitacion({ expira: ahora.toISOString() });
    const error = (i: Invitacion) =>
      capturarErrorHttp(() => aplicarInvitacion(i, proyecto, "u9", ahora));
    expect(error(ambas).status).toBe(409);
    expect(error(justo).status).toBe(410);
  });

  it("sin invitación o sin proyecto da 404; quien ya es miembro, 409", () => {
    const error = (
      i: Invitacion | null,
      p: typeof proyecto | null,
      uid = "u9",
    ) => capturarErrorHttp(() => aplicarInvitacion(i, p, uid, ahora)).status;
    expect(error(null, proyecto)).toBe(404);
    expect(error(invitacion(), null)).toBe(404);
    expect(error(invitacion(), proyecto, "u3")).toBe(409);
  });
});

describe("describirInvitacion", () => {
  const estado = async (i: Invitacion, uid = "u9") => {
    invitaciones.obtenerInvitacion.mockResolvedValue(i);
    return (await describirInvitacion(uid, i.codigo, ahora)).estado;
  };

  it("distingue válida, usada, vencida y ya miembro", async () => {
    expect(await estado(invitacion())).toBe("valida");
    expect(await estado(invitacion({ usada: true }))).toBe("usada");
    expect(
      await estado(invitacion({ expira: "2026-11-10T10:00:00.000Z" })),
    ).toBe("vencida");
    expect(await estado(invitacion({ usada: true }), "u3")).toBe("miembro");
  });
});

describe("describirInvitacion · datos y errores", () => {
  it("devuelve el nombre del proyecto y el rol", async () => {
    invitaciones.obtenerInvitacion.mockResolvedValue(invitacion());
    expect(await describirInvitacion("u9", "abc123", ahora)).toEqual({
      proyectoId: "p1",
      nombreProyecto: "Tablero de clase",
      rol: "editor",
      estado: "valida",
    });
  });

  it("un código inexistente, inválido o de un proyecto borrado da 404", async () => {
    invitaciones.obtenerInvitacion.mockResolvedValue(null);
    await expect(
      describirInvitacion("u9", "nada", ahora),
    ).rejects.toMatchObject({
      status: 404,
    });
    await expect(describirInvitacion("u9", "a.b", ahora)).rejects.toMatchObject(
      {
        status: 404,
      },
    );
    invitaciones.obtenerInvitacion.mockResolvedValue(invitacion());
    proyectos.obtenerProyecto.mockResolvedValue(null);
    await expect(
      describirInvitacion("u9", "abc123", ahora),
    ).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("crearInvitacion", () => {
  it("vence a los 7 días de crearla y no está usada", async () => {
    const creada = await crearInvitacion(
      proyecto,
      "u1",
      { rol: "lector" },
      ahora,
    );
    expect(creada.expira).toBe(
      new Date(ahora.getTime() + DURACION_INVITACION_MS).toISOString(),
    );
    expect(creada).toMatchObject({
      proyectoId: "p1",
      rol: "lector",
      usada: false,
    });
    expect(invitaciones.guardarInvitacionNueva).toHaveBeenCalledWith(creada);
  });

  it("cada invitación recibe un código distinto", async () => {
    const a = await crearInvitacion(proyecto, "u1", { rol: "lector" }, ahora);
    const b = await crearInvitacion(proyecto, "u1", { rol: "lector" }, ahora);
    expect(a.codigo).not.toBe(b.codigo);
  });
});
