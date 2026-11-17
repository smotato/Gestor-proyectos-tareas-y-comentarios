import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/**
 * Reto «Prueba en 3 anchos con Playwright»: cada página pública, en 360, 768
 * y 1024 px (los proyectos de playwright.config.ts), sin scroll horizontal y
 * con 0 violaciones de axe en los cuatro temas.
 */

const PAGINAS = [
  { ruta: "/", nombre: "portada" },
  { ruta: "/login", nombre: "inicio de sesión" },
  { ruta: "/registro", nombre: "registro" },
] as const;

const TEMAS = [
  { nombre: "claro", colorScheme: "light", contrast: "no-preference" },
  { nombre: "oscuro", colorScheme: "dark", contrast: "no-preference" },
  {
    nombre: "claro con alto contraste",
    colorScheme: "light",
    contrast: "more",
  },
  {
    nombre: "oscuro con alto contraste",
    colorScheme: "dark",
    contrast: "more",
  },
] as const;

const REGLAS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function violacionesDeAxe(page: Page): Promise<string[]> {
  const resultado = await new AxeBuilder({ page })
    .withTags(REGLAS_WCAG)
    .analyze();
  return resultado.violations.map((v) => {
    return `${v.id}: ${v.help} (${v.nodes.length} elementos)`;
  });
}

for (const { ruta, nombre } of PAGINAS) {
  test.describe(`${nombre} (${ruta})`, () => {
    test("no tiene scroll horizontal", async ({ page }) => {
      await page.goto(ruta);
      const medidas = await page.evaluate(() => ({
        contenido: document.documentElement.scrollWidth,
        ventana: document.documentElement.clientWidth,
      }));
      expect(medidas.contenido).toBeLessThanOrEqual(medidas.ventana);
    });

    test("carga sin bloqueos de CSP ni errores en la consola", async ({
      page,
    }) => {
      const problemas: string[] = [];
      page.on("console", (mensaje) => {
        if (mensaje.type() === "error") problemas.push(mensaje.text());
      });
      page.on("pageerror", (error) => problemas.push(error.message));
      await page.goto(ruta);
      await page.waitForLoadState("networkidle");
      expect(problemas).toEqual([]);
    });

    for (const tema of TEMAS) {
      test(`0 violaciones de axe en el tema ${tema.nombre}`, async ({
        page,
      }) => {
        await page.emulateMedia({
          colorScheme: tema.colorScheme,
          contrast: tema.contrast,
        });
        await page.goto(ruta);
        expect(await violacionesDeAxe(page)).toEqual([]);
      });
    }
  });
}
