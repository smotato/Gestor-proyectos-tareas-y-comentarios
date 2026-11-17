// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = process.cwd();
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), "utf8");

const calidad = leer("CALIDAD.md");
const pendientes = leer("calidad/README.md");

describe("CALIDAD.md", () => {
  it.each(["Reto 1", "Reto 2", "Reto 3"])(
    "la sección del %s dice qué es, cómo reproducirlo y su evidencia",
    (reto) => {
      const inicio = calidad.indexOf(`## ${reto} ·`);
      expect(inicio).toBeGreaterThan(-1);
      const siguiente = calidad.indexOf("\n## ", inicio + 1);
      const seccion = calidad.slice(inicio, siguiente);
      expect(seccion).toContain("**Qué es.**");
      expect(seccion).toContain("**Cómo reproducirlo.**");
      expect(seccion).toContain("**Evidencia.**");
    },
  );

  it("remite a la lista de evidencias que faltan", () => {
    expect(calidad).toContain("calidad/README.md");
  });
});

describe("calidad/README.md", () => {
  it.each([
    "Lighthouse",
    "360, 768 y 1024",
    "axe",
    "validador HTML",
    "LCP, INP y CLS",
    "Lista de comprobación manual",
  ])("lista la evidencia que falta: %s", (evidencia) => {
    expect(pendientes).toContain(evidencia);
  });
});

describe("pruebas de Playwright", () => {
  it("el script e2e corre Playwright y Vitest no lo ejecuta", () => {
    const paquete: { scripts: Record<string, string> } = JSON.parse(
      leer("package.json"),
    );
    expect(paquete.scripts.e2e).toBe("playwright test");
    expect(leer("vitest.config.ts")).toContain('"e2e/**"');
  });

  it("se prueba en 360, 768 y 1024 px", () => {
    const config = leer("playwright.config.ts");
    for (const ancho of [360, 768, 1024]) {
      expect(config).toContain(`width: ${ancho}`);
    }
  });

  it("recorre la portada, el login y el registro con axe en los cuatro temas", () => {
    const spec = leer("e2e/accesibilidad.spec.ts");
    for (const ruta of ['"/"', '"/login"', '"/registro"']) {
      expect(spec).toContain(`ruta: ${ruta}`);
    }
    expect(spec).toContain("@axe-core/playwright");
    expect(spec.match(/colorScheme: "(light|dark)"/g)).toHaveLength(4);
    expect(spec).toContain('contrast: "more"');
  });
});
