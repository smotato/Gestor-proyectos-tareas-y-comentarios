import { describe, expect, it } from "vitest";
import {
  exigirPermisoEliminarComentario,
  prepararComentarioNuevo,
} from "@/services/comentarios";
import { capturarErrorHttp } from "../ayudas";

const miembros = { u1: "propietario", u2: "editor", u3: "lector" } as const;
const ahora = new Date("2026-11-16T10:00:00.000Z");

const comentar = (actorUid: string, entrada: unknown) =>
  prepararComentarioNuevo({ id: "c1", actorUid, miembros, entrada, ahora });

describe("prepararComentarioNuevo", () => {
  it("un editor comenta; el autor y la fecha los pone el servidor", () => {
    expect(comentar("u2", { texto: " Ya subí la maqueta " })).toEqual({
      id: "c1",
      uid: "u2",
      texto: "Ya subí la maqueta",
      creadoEn: "2026-11-16T10:00:00.000Z",
    });
  });

  it("el propietario también puede comentar", () => {
    expect(comentar("u1", { texto: "Bien" }).uid).toBe("u1");
  });

  it("un lector no puede comentar (403)", () => {
    expect(
      capturarErrorHttp(() => comentar("u3", { texto: "Hola" })).status,
    ).toBe(403);
  });

  it("quien no es miembro recibe 404", () => {
    const error = capturarErrorHttp(() => comentar("nadie", { texto: "Hola" }));
    expect(error.status).toBe(404);
  });

  it("valida el texto y rechaza que el cliente mande el autor (400)", () => {
    const vacio = capturarErrorHttp(() => comentar("u2", { texto: "  " }));
    const suplantado = capturarErrorHttp(() =>
      comentar("u2", { texto: "Hola", uid: "u1" }),
    );
    expect(vacio.status).toBe(400);
    expect(vacio.detalles[0]?.campo).toBe("texto");
    expect(suplantado.status).toBe(400);
  });
});

describe("exigirPermisoEliminarComentario", () => {
  it("propietario y editor pueden eliminar comentarios", () => {
    expect(() => exigirPermisoEliminarComentario(miembros, "u1")).not.toThrow();
    expect(() => exigirPermisoEliminarComentario(miembros, "u2")).not.toThrow();
  });

  it("un lector recibe 403 y quien no es miembro 404", () => {
    const lector = capturarErrorHttp(() =>
      exigirPermisoEliminarComentario(miembros, "u3"),
    );
    const externo = capturarErrorHttp(() =>
      exigirPermisoEliminarComentario(miembros, "nadie"),
    );
    expect(lector.status).toBe(403);
    expect(externo.status).toBe(404);
  });
});
