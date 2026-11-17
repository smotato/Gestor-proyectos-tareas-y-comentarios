import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * Solo las capturas de pantalla (`npm run capturas`): los mismos tres anchos y
 * el mismo servidor de producción que las pruebas de extremo a extremo, sin
 * informe HTML.
 */
export default defineConfig({
  ...base,
  testDir: "./e2e/capturas",
  testIgnore: [],
  reporter: [["list"]],
});
