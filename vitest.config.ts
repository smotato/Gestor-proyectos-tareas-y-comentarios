import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Playwright (e2e/) y el hook de IA (scripts/) tienen sus propios comandos: no son de Vitest.
    exclude: [...configDefaults.exclude, "e2e/**", "scripts/**"],
    coverage: {
      provider: "v8",
      include: ["src/services/**", "src/schemas/**"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
