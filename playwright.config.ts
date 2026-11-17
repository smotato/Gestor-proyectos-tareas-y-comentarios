import { defineConfig, devices } from "@playwright/test";

/** Distinto de 3000 para no chocar con `npm run dev`. */
const PUERTO = 3100;

/**
 * Pruebas de extremo a extremo con una compilación de producción
 * (`npm run build` + `npm run start`), igual que en Vercel.
 * Los tres anchos son los de la sección 14.2 de los requisitos.
 */
export default defineConfig({
  testDir: "./e2e",
  // Las capturas tienen su propio comando: `npm run capturas`.
  testIgnore: "**/capturas/**",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "calidad/playwright-report" }],
  ],
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "movil-360",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 740 },
      },
    },
    {
      name: "tableta-768",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "escritorio-1024",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 768 },
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
