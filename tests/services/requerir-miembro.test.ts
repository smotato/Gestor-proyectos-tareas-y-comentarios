import { describe, expect, it } from "vitest";
import { requerirMiembro } from "@/services/proyectos";
import { proyectoDePrueba } from "../api/simulaciones";
import { capturarErrorHttp } from "../ayudas";

const proyecto = proyectoDePrueba();

describe("requerirMiembro(proyecto, uid, rolMinimo)", () => {
  it("devuelve el rol si alcanza el mínimo", () => {
    expect(requerirMiembro(proyecto, "u1", "propietario")).toBe("propietario");
    expect(requerirMiembro(proyecto, "u2", "editor")).toBe("editor");
    expect(requerirMiembro(proyecto, "u3", "lector")).toBe("lector");
  });

  it("responde 403 si el rol no alcanza", () => {
    const editor = capturarErrorHttp(() =>
      requerirMiembro(proyecto, "u2", "propietario"),
    );
    const lector = capturarErrorHttp(() =>
      requerirMiembro(proyecto, "u3", "editor"),
    );
    expect(editor.status).toBe(403);
    expect(lector.status).toBe(403);
  });

  it("responde 404 si no es miembro o el proyecto no existe", () => {
    for (const [p, uid] of [
      [proyecto, "u9"],
      [proyecto, "toString"],
      [null, "u1"],
    ] as const) {
      expect(
        capturarErrorHttp(() => requerirMiembro(p, uid, "lector")).status,
      ).toBe(404);
    }
  });
});
