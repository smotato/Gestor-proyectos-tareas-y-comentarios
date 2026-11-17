// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actividad } from "@/schemas/actividad";
import type { Proyecto } from "@/schemas/proyecto";
import type { Tarea } from "@/schemas/tarea";

/**
 * Integración ruta → servicio → repositorio (simulado en memoria): cada cambio
 * que llega por la API deja su registro, y la ruta de actividad lo devuelve.
 */

const sesion = vi.hoisted((): { uid: string } => ({ uid: "u2" }));
vi.mock("@/lib/auth", () => ({
  requerirUsuario: async () => ({ uid: sesion.uid, correo: null, rol: null }),
}));
const bd = vi.hoisted((): { registros: Actividad[]; contador: number } => ({
  registros: [],
  contador: 0,
}));
const proyectos = vi.hoisted(() => ({
  obtenerProyecto: vi.fn(),
  modificarMembresia: vi.fn(),
}));
vi.mock("@/repositories/proyectos", () => proyectos);
vi.mock("@/repositories/usuarios", () => ({
  correosPorUid: async () => new Map([["u3", "carlos@ejemplo.com"]]),
}));
const tareas = vi.hoisted(() => ({
  obtenerTarea: vi.fn(),
  modificarTarea: vi.fn(),
  nuevoIdTarea: vi.fn(),
  guardarTareaNueva: vi.fn(),
}));
vi.mock("@/repositories/tareas", () => tareas);
const comentarios = vi.hoisted(() => ({
  nuevoIdComentario: vi.fn(),
  guardarComentarioNuevo: vi.fn(),
}));
vi.mock("@/repositories/comentarios", () => comentarios);
vi.mock("@/repositories/actividad", () => ({
  nuevoIdActividad: () => `a${(bd.contador += 1)}`,
  listarActividad: async () => ({
    items: [...bd.registros].reverse(),
    siguienteCursor: null,
  }),
}));

import { GET as verActividad } from "@/app/api/proyectos/[id]/actividad/route";
import { PATCH as cambiarRol } from "@/app/api/proyectos/[id]/miembros/[uid]/route";
import { POST as comentar } from "@/app/api/proyectos/[id]/tareas/[tid]/comentarios/route";
import { PATCH as editarTarea } from "@/app/api/proyectos/[id]/tareas/[tid]/route";
import { POST as crearTarea } from "@/app/api/proyectos/[id]/tareas/route";
import {
  conParams,
  peticionJson,
  proyectoDePrueba,
  tareaDePrueba,
} from "./simulaciones";

/** Como una transacción: aplica el cambio y guarda el registro con él. */
function simularRepositorios(tarea: Tarea, proyecto: Proyecto) {
  const guardar = (registro: Actividad | null | undefined) => {
    if (registro) bd.registros.push(registro);
  };
  proyectos.obtenerProyecto.mockResolvedValue(proyecto);
  tareas.obtenerTarea.mockResolvedValue(tarea);
  tareas.modificarTarea.mockImplementation(
    async (
      _proyecto: string,
      _id: string,
      cambio: (actual: Tarea | null) => Tarea,
      registrar?: (antes: Tarea, despues: Tarea) => Actividad | null,
    ) => {
      const nueva = cambio(tarea);
      guardar(registrar?.(tarea, nueva));
      return nueva;
    },
  );
  proyectos.modificarMembresia.mockImplementation(
    async (
      _id: string,
      cambio: (actual: Proyecto | null) => Proyecto,
      registrar?: (antes: Proyecto, despues: Proyecto) => Actividad | null,
    ) => {
      const nuevo = cambio(proyecto);
      guardar(registrar?.(proyecto, nuevo));
      return nuevo;
    },
  );
  tareas.guardarTareaNueva.mockImplementation(
    async (_p: string, _t: Tarea, registro: Actividad) => guardar(registro),
  );
  comentarios.guardarComentarioNuevo.mockImplementation(
    async (_p: string, _t: string, _c: unknown, registro: Actividad) =>
      guardar(registro),
  );
}

const BASE = "/api/proyectos/p1";

async function actividadVisible(): Promise<Actividad[]> {
  sesion.uid = "u3";
  const peticion = new Request(`http://localhost:3000${BASE}/actividad`);
  const respuesta = await verActividad(peticion, conParams({ id: "p1" }));
  const cuerpo: { items: Actividad[] } = await respuesta.json();
  return cuerpo.items;
}

beforeEach(() => {
  vi.resetAllMocks();
  bd.registros = [];
  bd.contador = 0;
  tareas.nuevoIdTarea.mockReturnValue("t9");
  comentarios.nuevoIdComentario.mockReturnValue("c9");
  simularRepositorios(tareaDePrueba(), proyectoDePrueba());
});

describe("cambiar el estado de una tarea", () => {
  it("queda en la actividad, con quién lo hizo y el detalle", async () => {
    sesion.uid = "u2";
    const cuerpo = { estado: "hecha" };
    const peticion = peticionJson(`${BASE}/tareas/t1`, "PATCH", cuerpo);
    const respuesta = await editarTarea(
      peticion,
      conParams({ id: "p1", tid: "t1" }),
    );
    expect(respuesta.status).toBe(200);
    const registros = await actividadVisible();
    expect(registros).toHaveLength(1);
    expect(registros[0]).toMatchObject({
      uid: "u2",
      accion: "estadoCambiado",
      detalle: "Cambió el estado de «Maqueta» de Pendiente a Hecha",
    });
  });

  it("editar otros campos sin cambiar el estado no deja registro", async () => {
    sesion.uid = "u2";
    const peticion = peticionJson(`${BASE}/tareas/t1`, "PATCH", {
      titulo: "Maqueta v2",
    });
    await editarTarea(peticion, conParams({ id: "p1", tid: "t1" }));
    expect(await actividadVisible()).toEqual([]);
  });

  it("un lector no puede cambiarlo (403) y no queda registro", async () => {
    sesion.uid = "u3";
    const peticion = peticionJson(`${BASE}/tareas/t1`, "PATCH", {
      estado: "hecha",
    });
    const respuesta = await editarTarea(
      peticion,
      conParams({ id: "p1", tid: "t1" }),
    );
    expect(respuesta.status).toBe(403);
    expect(await actividadVisible()).toEqual([]);
  });
});

describe("crear tarea, comentar y cambiar un rol", () => {
  it("crear una tarea y comentar dejan su registro, lo más reciente primero", async () => {
    sesion.uid = "u2";
    await crearTarea(
      peticionJson(`${BASE}/tareas`, "POST", { titulo: "Informe" }),
      conParams({ id: "p1" }),
    );
    await comentar(
      peticionJson(`${BASE}/tareas/t1/comentarios`, "POST", { texto: "Listo" }),
      conParams({ id: "p1", tid: "t1" }),
    );
    const registros = await actividadVisible();
    expect(registros.map((r) => r.accion)).toEqual([
      "comentarioCreado",
      "tareaCreada",
    ]);
    expect(registros[1]?.detalle).toBe("Creó la tarea «Informe»");
    expect(registros.every((r) => r.uid === "u2")).toBe(true);
  });

  it("el propietario cambia un rol y queda con el correo del miembro", async () => {
    sesion.uid = "u1";
    const peticion = peticionJson(`${BASE}/miembros/u3`, "PATCH", {
      rol: "editor",
    });
    const respuesta = await cambiarRol(
      peticion,
      conParams({ id: "p1", uid: "u3" }),
    );
    expect(respuesta.status).toBe(200);
    const registros = await actividadVisible();
    expect(registros[0]).toMatchObject({
      uid: "u1",
      accion: "rolCambiado",
      detalle: "Cambió el rol de carlos@ejemplo.com a Editor",
    });
  });
});
