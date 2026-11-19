// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contraste, leerTemas } from "./contraste";

/** Sistema de diseño del dashboard: colores de apoyo, estructura y diálogo. */

const APP = join(process.cwd(), "src/app");
const leer = (archivo: string) => readFileSync(join(APP, archivo), "utf8");
const temas = leerTemas(leer("globals.css"));

/** Texto sobre su fondo suave: deben llegar a 4,5:1 en claro y en oscuro. */
const PARES_SEMANTICOS = [
  ["exito-texto", "exito-fondo"],
  ["aviso-texto", "aviso-fondo"],
  ["info-texto", "info-fondo"],
  ["error", "error-fondo"],
  ["acento", "acento-suave"],
  ["texto", "acento-suave"],
  ["texto-tenue", "acento-suave"],
] as const;

describe("colores semánticos", () => {
  it.each(["claro", "oscuro"] as const)("%s: texto AA", (nombre) => {
    const tema = temas[nombre];
    for (const [texto, fondo] of PARES_SEMANTICOS) {
      const a = tema[texto];
      const b = tema[fondo];
      expect(a, `falta --${texto}`).toBeDefined();
      expect(b, `falta --${fondo}`).toBeDefined();
      expect(contraste(a ?? "", b ?? "")).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("estructura del CSS", () => {
  it("el marco usa rem y un solo punto de corte de escritorio a 64 rem", () => {
    const css = leer("app-shell.css");
    expect(css).toContain("@media (min-width: 64rem)");
    expect(css).toContain("--menu-ancho-contraido");
  });

  it("no hay anchos fijos en píxeles (solo bordes y contornos finos)", () => {
    for (const archivo of ["globals.css", "ui.css", "app-shell.css"]) {
      const css = leer(archivo).replace(/\/\*[\s\S]*?\*\//g, "");
      const medidas = css.match(/\b\d+(?:\.\d+)?px\b/g) ?? [];
      const grandes = medidas.filter((m) => Number.parseFloat(m) > 4);
      expect(grandes, archivo).toEqual([]);
    }
  });

  it("respeta prefers-reduced-motion", () => {
    expect(leer("globals.css")).toContain("prefers-reduced-motion: reduce");
  });
});

describe("diálogo «Nueva tarea»", () => {
  const css = leer("tareas.css");

  it("se centra, limita su ancho con clamp() y oscurece el fondo", () => {
    expect(css).toMatch(/\.dialogo\s*\{[^}]*width:\s*clamp\(/);
    expect(css).toMatch(/\.dialogo:modal\s*\{[^}]*margin:\s*auto/);
    expect(css).toMatch(/\.dialogo::backdrop\s*\{[^}]*background:/);
  });

  it("hace scroll interno, alinea los botones a la derecha y usa dos columnas desde 768 px", () => {
    expect(css).toMatch(/\.dialogo\s*\{[^}]*overflow-y:\s*auto/);
    expect(css).toMatch(
      /\.acciones-formulario\s*\{[^}]*justify-content:\s*flex-end/,
    );
    expect(css).toMatch(
      /@media \(min-width: 48rem\)[\s\S]*\.dialogo \.formulario\s*\{[^}]*repeat\(2/,
    );
  });
});
