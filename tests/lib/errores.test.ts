import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  ErrorHttp,
  errorDeCampo,
  errorDeValidacion,
  noEncontrado,
  prohibido,
} from "@/lib/errores";

function errorZod(esquema: z.ZodType, valor: unknown): z.ZodError {
  const resultado = esquema.safeParse(valor);
  if (resultado.success) throw new Error("La validación debía fallar");
  return resultado.error;
}

describe("errores HTTP", () => {
  it("prohibido responde 403 y noEncontrado 404", () => {
    expect(prohibido()).toBeInstanceOf(ErrorHttp);
    expect(prohibido().status).toBe(403);
    expect(noEncontrado().status).toBe(404);
    expect(noEncontrado("Proyecto no encontrado").message).toBe(
      "Proyecto no encontrado",
    );
  });

  it("errorDeCampo responde 400 con el detalle del campo", () => {
    const error = errorDeCampo("responsableUid", "No es miembro");
    expect(error.status).toBe(400);
    expect(error.detalles).toEqual([
      { campo: "responsableUid", mensaje: "No es miembro" },
    ]);
  });

  it("errorDeValidacion convierte los errores de Zod en detalles por campo", () => {
    const esquema = z.strictObject({
      titulo: z.string().min(1, "Obligatorio"),
      extra: z.strictObject({ n: z.number() }),
    });
    const error = errorDeValidacion(
      errorZod(esquema, { titulo: "", extra: { n: "x" }, intruso: 1 }),
    );
    expect(error.status).toBe(400);
    const campos = error.detalles.map((d) => d.campo);
    expect([...campos].sort()).toEqual(["extra.n", "intruso", "titulo"]);
    const titulo = error.detalles.find((d) => d.campo === "titulo");
    expect(titulo?.mensaje).toBe("Obligatorio");
  });
});
