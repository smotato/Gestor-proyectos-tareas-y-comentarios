// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = process.cwd();
const readme = readFileSync(join(RAIZ, "README.md"), "utf8");
const paquete: { scripts: Record<string, string> } = JSON.parse(
  readFileSync(join(RAIZ, "package.json"), "utf8"),
);
const scripts = Object.keys(paquete.scripts).filter((s) => s !== "prepare");

describe("README.md", () => {
  it.each(scripts)("documenta el script %s", (script) => {
    expect(readme).toContain(`npm run ${script}`);
  });

  it("no menciona scripts que no existen", () => {
    const citados = [...readme.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]);
    for (const script of citados) {
      expect(Object.keys(paquete.scripts)).toContain(script);
    }
  });

  it("explica la API: openapi.yaml, la colección de Bruno y la integración continua", () => {
    expect(readme).toContain("openapi.yaml");
    expect(readme).toContain("bruno/");
    expect(readme).toContain("Open Collection");
    expect(readme).toContain(".github/workflows/ci.yml");
  });
});

describe("README.md · despliegue en Vercel", () => {
  const variables = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "SITE_URL",
  ];

  it("tiene la sección y lista cada variable de entorno por su nombre", () => {
    expect(readme).toContain("## Despliegue en Vercel");
    for (const variable of variables)
      expect(readme).toContain(`\`${variable}\``);
  });

  it("avisa que las variables de los emuladores no van en producción", () => {
    for (const nombre of [
      "NEXT_PUBLIC_USAR_EMULADORES",
      "FIREBASE_AUTH_EMULATOR_HOST",
      "FIRESTORE_EMULATOR_HOST",
    ]) {
      expect(readme).toContain(nombre);
    }
  });

  it("no incluye ningún valor secreto", () => {
    expect(readme).not.toMatch(/-----BEGIN/);
    expect(readme).not.toMatch(/AIza[\w-]{20,}/);
    expect(readme).not.toMatch(/FIREBASE_PRIVATE_KEY\s*=/);
  });
});
