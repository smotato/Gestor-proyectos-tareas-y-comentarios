// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  contraste,
  leerTemas,
  PARES_CONTROLES,
  PARES_TEXTO,
  paresQueFallan,
  TOKENS_DE_COLOR,
} from "./contraste";

/**
 * Reto «Modo oscuro y alto contraste»: los cuatro temas (claro, oscuro y sus
 * versiones de alto contraste) cumplen WCAG 2.2 AA sin necesitar el navegador.
 */

const APP = join(process.cwd(), "src/app");
const temas = leerTemas(readFileSync(join(APP, "globals.css"), "utf8"));
const NOMBRES = ["claro", "oscuro", "claroAlto", "oscuroAlto"] as const;
const ALTO_CONTRASTE = ["claroAlto", "oscuroAlto"] as const;

describe("temas de color · definición", () => {
  it("la fórmula de contraste da los valores de referencia de WCAG", () => {
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contraste("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contraste("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it.each(NOMBRES)("el tema %s define los nueve tokens de color", (nombre) => {
    for (const token of TOKENS_DE_COLOR) {
      expect(temas[nombre][token]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("«oscuro + alto contraste» redefine todo lo que redefine el alto contraste", () => {
    const delAlto = Object.keys(temas.bloques.alto).sort();
    const delOscuroAlto = Object.keys(temas.bloques.oscuroAlto).sort();
    expect(delAlto).toHaveLength(TOKENS_DE_COLOR.length);
    expect(delOscuroAlto).toEqual(delAlto);
  });
});

describe("temas de color · contraste AA", () => {
  it.each(NOMBRES)("%s: el texto llega a 4,5:1", (nombre) => {
    expect(paresQueFallan(temas[nombre], PARES_TEXTO, 4.5)).toEqual([]);
  });

  it.each(NOMBRES)("%s: bordes, foco e indicadores llegan a 3:1", (nombre) => {
    expect(paresQueFallan(temas[nombre], PARES_CONTROLES, 3)).toEqual([]);
  });
});

describe("temas de alto contraste", () => {
  it.each(ALTO_CONTRASTE)("%s: texto a 7:1 y controles a 4,5:1", (nombre) => {
    expect(paresQueFallan(temas[nombre], PARES_TEXTO, 7)).toEqual([]);
    expect(paresQueFallan(temas[nombre], PARES_CONTROLES, 4.5)).toEqual([]);
  });

  it("hay reglas para bordes gruesos y para los colores forzados de Windows", () => {
    const css = readFileSync(join(APP, "contraste.css"), "utf8");
    expect(css).toContain("@media (prefers-contrast: more)");
    expect(css).toContain("@media (forced-colors: active)");
    expect(css).toContain("outline-width: 4px");
  });
});

describe("no hay colores fuera de los temas", () => {
  /** El único color fijo permitido: el velo oscuro detrás del diálogo. */
  const VELO = /rgb\(0 0 0 \/ 0\.6\)/g;
  const COLOR_FIJO = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|color-mix)\(/gi;

  it("todo color de los CSS sale de un token", () => {
    const archivos = readdirSync(APP).filter((a) => a.endsWith(".css"));
    expect(archivos.length).toBeGreaterThanOrEqual(5);
    for (const archivo of archivos) {
      const sinTokens = readFileSync(join(APP, archivo), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/:root\s*\{[^}]*\}/g, "")
        .replace(VELO, "");
      const fijos = sinTokens.match(COLOR_FIJO) ?? [];
      expect({ archivo, fijos }).toEqual({ archivo, fijos: [] });
    }
  });
});
