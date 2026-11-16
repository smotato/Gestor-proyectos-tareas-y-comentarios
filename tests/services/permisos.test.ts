import { describe, expect, it } from "vitest";
import type { Rol } from "@/schemas/rol";
import {
  ACCIONES,
  esUltimoPropietario,
  puede,
  puedeCambiarRolDe,
  puedeQuitarMiembro,
  type Accion,
} from "@/services/permisos";

const tabla: Record<Accion, Record<Rol, boolean>> = {
  ver: { propietario: true, editor: true, lector: true },
  crear: { propietario: true, editor: true, lector: false },
  editar: { propietario: true, editor: true, lector: false },
  eliminarTarea: { propietario: true, editor: true, lector: false },
  eliminarProyecto: { propietario: true, editor: false, lector: false },
  invitar: { propietario: true, editor: false, lector: false },
  cambiarRol: { propietario: true, editor: false, lector: false },
};

const casos = ACCIONES.flatMap((accion) =>
  (["propietario", "editor", "lector"] as const).map(
    (rol) => [rol, accion, tabla[accion][rol]] as const,
  ),
);

describe("puede(rol, accion)", () => {
  it("cubre las 7 acciones", () => {
    expect([...ACCIONES].sort()).toEqual(Object.keys(tabla).sort());
  });

  it.each(casos)("%s · %s → %s", (rol, accion, esperado) => {
    expect(puede(rol, accion)).toBe(esperado);
  });

  it("un lector no puede crear ni editar", () => {
    expect(puede("lector", "crear")).toBe(false);
    expect(puede("lector", "editar")).toBe(false);
  });

  it("un editor no puede eliminar el proyecto, invitar ni cambiar roles", () => {
    expect(puede("editor", "eliminarProyecto")).toBe(false);
    expect(puede("editor", "invitar")).toBe(false);
    expect(puede("editor", "cambiarRol")).toBe(false);
  });
});

describe("último propietario", () => {
  const unPropietario = {
    u1: "propietario",
    u2: "editor",
    u3: "lector",
  } as const;
  const dosPropietarios = { u1: "propietario", u2: "propietario" } as const;

  it("esUltimoPropietario detecta al único propietario", () => {
    expect(esUltimoPropietario(unPropietario, "u1")).toBe(true);
    expect(esUltimoPropietario(unPropietario, "u2")).toBe(false);
    expect(esUltimoPropietario(dosPropietarios, "u1")).toBe(false);
  });

  it("no se puede eliminar al último propietario", () => {
    expect(puedeQuitarMiembro(unPropietario, "u1")).toBe(false);
  });

  it("no se puede degradar al último propietario", () => {
    expect(puedeCambiarRolDe(unPropietario, "u1", "editor")).toBe(false);
    expect(puedeCambiarRolDe(unPropietario, "u1", "lector")).toBe(false);
  });

  it("con dos propietarios sí se puede quitar o degradar a uno", () => {
    expect(puedeQuitarMiembro(dosPropietarios, "u1")).toBe(true);
    expect(puedeCambiarRolDe(dosPropietarios, "u1", "lector")).toBe(true);
  });

  it("se puede quitar o cambiar el rol de un editor o un lector", () => {
    expect(puedeQuitarMiembro(unPropietario, "u2")).toBe(true);
    expect(puedeQuitarMiembro(unPropietario, "u3")).toBe(true);
    expect(puedeCambiarRolDe(unPropietario, "u3", "editor")).toBe(true);
  });

  it("el último propietario puede 'cambiar' a propietario (sin efecto)", () => {
    expect(puedeCambiarRolDe(unPropietario, "u1", "propietario")).toBe(true);
  });

  it("no se puede quitar ni cambiar a quien no es miembro", () => {
    expect(puedeQuitarMiembro(unPropietario, "nadie")).toBe(false);
    expect(puedeCambiarRolDe(unPropietario, "nadie", "editor")).toBe(false);
    expect(puedeQuitarMiembro(unPropietario, "toString")).toBe(false);
    expect(puedeCambiarRolDe(unPropietario, "constructor", "editor")).toBe(
      false,
    );
  });
});
