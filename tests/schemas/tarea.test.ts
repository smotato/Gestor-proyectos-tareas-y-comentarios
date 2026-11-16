import { describe, expect, it } from "vitest";
import {
  ActualizarTareaSchema,
  CrearTareaSchema,
  ESTADOS_TAREA,
  PRIORIDADES,
  TareaSchema,
} from "@/schemas/tarea";

const tareaValida = {
  id: "t1",
  titulo: "Diseñar el tablero",
  descripcion: "",
  estado: "pendiente",
  prioridad: "media",
  responsableUid: null,
  vence: null,
  creadaPor: "u1",
  creadaEn: "2026-11-16T10:00:00.000Z",
};

describe("estados y prioridades", () => {
  it("define los valores permitidos", () => {
    expect(ESTADOS_TAREA).toEqual(["pendiente", "enProgreso", "hecha"]);
    expect(PRIORIDADES).toEqual(["baja", "media", "alta"]);
  });
});

describe("TareaSchema", () => {
  it("acepta una tarea válida", () => {
    expect(TareaSchema.safeParse(tareaValida).success).toBe(true);
  });

  it("acepta responsable y fecha de vencimiento", () => {
    const resultado = TareaSchema.safeParse({
      ...tareaValida,
      responsableUid: "u2",
      vence: "2026-12-01",
    });
    expect(resultado.success).toBe(true);
  });

  it.each([
    ["estado", "bloqueada"],
    ["prioridad", "urgente"],
    ["vence", "01/12/2026"],
    ["titulo", "   "],
    ["creadaEn", "ayer"],
    ["publica", true],
  ])("rechaza %s = %j", (campo, valor) => {
    const resultado = TareaSchema.safeParse({ ...tareaValida, [campo]: valor });
    expect(resultado.success).toBe(false);
  });
});

describe("CrearTareaSchema", () => {
  it("recorta el título y aplica valores por defecto", () => {
    expect(CrearTareaSchema.parse({ titulo: "  Escribir pruebas " })).toEqual({
      titulo: "Escribir pruebas",
      descripcion: "",
      prioridad: "media",
      responsableUid: null,
      vence: null,
    });
  });

  it.each([
    { titulo: "x".repeat(121) },
    { titulo: "Ok", descripcion: "x".repeat(2001) },
    { titulo: "Ok", prioridad: "urgente" },
  ])("rechaza datos inválidos: %#", (entrada) => {
    expect(CrearTareaSchema.safeParse(entrada).success).toBe(false);
  });

  it.each([{ estado: "hecha" }, { creadaPor: "otro" }, { id: "x" }])(
    "rechaza campos que decide el servidor: %o",
    (extra) => {
      const resultado = CrearTareaSchema.safeParse({ titulo: "Ok", ...extra });
      expect(resultado.success).toBe(false);
    },
  );
});

describe("ActualizarTareaSchema", () => {
  it("acepta un cambio parcial", () => {
    expect(ActualizarTareaSchema.parse({ estado: "hecha" })).toEqual({
      estado: "hecha",
    });
  });

  it("permite quitar el responsable y la fecha", () => {
    const cambios = { responsableUid: null, vence: null };
    expect(ActualizarTareaSchema.parse(cambios)).toEqual(cambios);
  });

  it("rechaza un objeto vacío", () => {
    expect(ActualizarTareaSchema.safeParse({}).success).toBe(false);
  });

  it("rechaza campos que no se pueden editar", () => {
    const resultado = ActualizarTareaSchema.safeParse({ creadaPor: "otro" });
    expect(resultado.success).toBe(false);
  });
});
