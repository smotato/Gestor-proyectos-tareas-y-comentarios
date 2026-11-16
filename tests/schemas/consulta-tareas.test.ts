import { describe, expect, it } from "vitest";
import {
  ConsultaTareasSchema,
  FiltrosTareasSchema,
} from "@/schemas/consulta-tareas";

describe("FiltrosTareasSchema", () => {
  it("acepta filtros válidos y un objeto vacío", () => {
    expect(FiltrosTareasSchema.safeParse({}).success).toBe(true);
    const completo = { estado: "enProgreso", responsable: "u1", mias: "1" };
    expect(FiltrosTareasSchema.safeParse(completo).success).toBe(true);
  });

  it.each([{ estado: "zzz" }, { mias: "si" }, { responsable: " " }, { x: 1 }])(
    "rechaza %o",
    (filtros) => {
      expect(FiltrosTareasSchema.safeParse(filtros).success).toBe(false);
    },
  );
});

describe("ConsultaTareasSchema", () => {
  it("añade límite (20 por defecto, máximo 100) y cursor", () => {
    expect(ConsultaTareasSchema.parse({ estado: "hecha" })).toEqual({
      estado: "hecha",
      limite: 20,
    });
    expect(ConsultaTareasSchema.safeParse({ limite: "100" }).success).toBe(
      true,
    );
    expect(ConsultaTareasSchema.safeParse({ limite: "101" }).success).toBe(
      false,
    );
    expect(ConsultaTareasSchema.safeParse({ cursor: "a/b" }).success).toBe(
      false,
    );
  });
});
