import { test } from "@playwright/test";

/**
 * Capturas de las páginas públicas en 360, 768 y 1024 px (`npm run capturas`).
 * Guardan `calidad/capturas/<página>-<ancho>.png`, por ejemplo `login-360.png`.
 * El ancho sale de los tres proyectos de playwright.config.ts, así que cada
 * página se captura tres veces, una por ancho.
 */

const PAGINAS = [
  { ruta: "/", nombre: "portada" },
  { ruta: "/login", nombre: "login" },
  { ruta: "/registro", nombre: "registro" },
] as const;

for (const { ruta, nombre } of PAGINAS) {
  test(`captura de ${nombre} (${ruta})`, async ({ page }) => {
    const ancho = page.viewportSize()?.width ?? "sin-ancho";
    // Siempre claro y sin animaciones, para que dos ejecuciones den lo mismo.
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(ruta);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: `calidad/capturas/${nombre}-${ancho}.png`,
      fullPage: true,
    });
  });
}
