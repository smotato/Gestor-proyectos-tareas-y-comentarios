import { describe, expect, it } from "vitest";
import { leerFiltros, urlConFiltros } from "@/lib/filtros-tareas";

describe("leerFiltros", () => {
  it("lee estado, responsable y mias de la URL", () => {
    expect(leerFiltros({ estado: "hecha", responsable: "u2" })).toEqual({
      estado: "hecha",
      responsable: "u2",
    });
    expect(leerFiltros({ mias: "1" })).toEqual({ mias: "1" });
  });

  it("ignora los parámetros vacíos que envía un formulario GET", () => {
    expect(leerFiltros({ estado: "", responsable: "" })).toEqual({});
  });

  it("con varios valores usa el primero y descarta los parámetros ajenos", () => {
    const filtros = leerFiltros({ estado: ["enProgreso", "hecha"], otro: "x" });
    expect(filtros).toEqual({ estado: "enProgreso" });
  });

  it("si un filtro es inválido no aplica ninguno", () => {
    expect(leerFiltros({ estado: "zzz", responsable: "u2" })).toEqual({});
    expect(leerFiltros({ mias: "0" })).toEqual({});
  });
});

describe("urlConFiltros", () => {
  it("arma la URL con URLSearchParams y escapa los valores", () => {
    expect(urlConFiltros("/proyectos/p1", { estado: "hecha", mias: "1" })).toBe(
      "/proyectos/p1?estado=hecha&mias=1",
    );
    expect(urlConFiltros("/p", { responsable: "a b&c" })).toBe(
      "/p?responsable=a+b%26c",
    );
  });

  it("sin filtros devuelve la ruta tal cual", () => {
    expect(urlConFiltros("/proyectos/p1", {})).toBe("/proyectos/p1");
  });
});
