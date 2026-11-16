import { describe, expect, it } from "vitest";
import { ComentarioSchema, CrearComentarioSchema } from "@/schemas/comentario";

const comentarioValido = {
  id: "c1",
  uid: "u2",
  texto: "Ya subí la maqueta",
  creadoEn: "2026-11-16T10:00:00.000Z",
};

describe("ComentarioSchema", () => {
  it("acepta un comentario válido", () => {
    expect(ComentarioSchema.safeParse(comentarioValido).success).toBe(true);
  });

  it.each([
    ["texto", ""],
    ["uid", ""],
    ["creadoEn", "hoy"],
    ["editado", true],
  ])("rechaza %s = %j", (campo, valor) => {
    const resultado = ComentarioSchema.safeParse({
      ...comentarioValido,
      [campo]: valor,
    });
    expect(resultado.success).toBe(false);
  });
});

describe("CrearComentarioSchema", () => {
  it("acepta solo el texto y lo recorta", () => {
    expect(CrearComentarioSchema.parse({ texto: "  Listo  " })).toEqual({
      texto: "Listo",
    });
  });

  it.each(["", "   ", "x".repeat(1001)])("rechaza el texto %#", (texto) => {
    expect(CrearComentarioSchema.safeParse({ texto }).success).toBe(false);
  });

  it.each([{ uid: "otro" }, { creadoEn: "2020-01-01T00:00:00.000Z" }])(
    "rechaza campos que decide el servidor: %o",
    (extra) => {
      const resultado = CrearComentarioSchema.safeParse({
        texto: "Hola",
        ...extra,
      });
      expect(resultado.success).toBe(false);
    },
  );
});
