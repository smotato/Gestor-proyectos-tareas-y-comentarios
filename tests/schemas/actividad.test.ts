import { describe, expect, it } from "vitest";
import { ACCIONES_ACTIVIDAD, ActividadSchema } from "@/schemas/actividad";

const registro = {
  id: "a1",
  uid: "u2",
  accion: "estadoCambiado",
  detalle: "Cambió el estado de «Maqueta» de Pendiente a Hecha",
  creadoEn: "2026-11-16T10:00:00.000Z",
};

describe("ActividadSchema", () => {
  it("define las cuatro acciones que se registran", () => {
    expect(ACCIONES_ACTIVIDAD).toEqual([
      "tareaCreada",
      "estadoCambiado",
      "comentarioCreado",
      "rolCambiado",
    ]);
  });

  it("acepta un registro válido", () => {
    expect(ActividadSchema.safeParse(registro).success).toBe(true);
  });

  it.each([
    ["accion", "borrado"],
    ["detalle", ""],
    ["detalle", "x".repeat(301)],
    ["creadoEn", "ayer"],
    ["uid", " "],
    ["ip", "127.0.0.1"],
  ])("rechaza %s = %j", (campo, valor) => {
    const resultado = ActividadSchema.safeParse({
      ...registro,
      [campo]: valor,
    });
    expect(resultado.success).toBe(false);
  });
});
