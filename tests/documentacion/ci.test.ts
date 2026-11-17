// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ci = readFileSync(
  join(process.cwd(), ".github/workflows/ci.yml"),
  "utf8",
);

describe("integración continua (.github/workflows/ci.yml)", () => {
  it("se ejecuta en push y en pull request a main", () => {
    expect(ci).toMatch(/^on:/m);
    expect(ci).toMatch(/push:\s+branches: \[main\]/);
    expect(ci).toMatch(/pull_request:\s+branches: \[main\]/);
  });

  it("usa Node 24 y acciones fijadas a una versión mayor", () => {
    expect(ci).toMatch(/node-version: 24\b/);
    expect(ci).toMatch(/uses: actions\/checkout@v\d+/);
    expect(ci).toMatch(/uses: actions\/setup-node@v\d+/);
  });

  it("instala, revisa, compila y audita, en ese orden", () => {
    const pasos = [
      "run: npm ci",
      "run: npm run check",
      "run: npm run build",
      "run: npm audit --audit-level=high",
    ];
    const posiciones = pasos.map((paso) => ci.indexOf(paso));
    expect(posiciones.every((posicion) => posicion > -1)).toBe(true);
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
  });

  it("tiene permisos mínimos, no usa secretos y salta los hooks de husky", () => {
    expect(ci).toMatch(/permissions:\s+contents: read/);
    expect(ci).not.toMatch(/secrets\./);
    expect(ci).toMatch(/HUSKY: "0"/);
  });
});
