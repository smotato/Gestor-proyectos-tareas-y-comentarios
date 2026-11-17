// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Retos de IA: el hook PreToolUse y el subagente revisor (sección 15 de requisitos). */

const RAIZ = process.cwd();
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), "utf8");

describe("reto de IA · hook PreToolUse", () => {
  const script = leer("scripts/ia/bloquear-acciones.mjs");
  const reglas = [
    leer("scripts/ia/lib/rutas.mjs"),
    leer("scripts/ia/lib/comandos.mjs"),
  ].join("\n");
  const pruebas = leer("scripts/ia/bloquear-acciones.test.mjs");

  it("sale con código 2 y escribe el motivo en stderr", () => {
    expect(script).toContain("process.stderr.write");
    expect(script).toMatch(/return 2;/);
    expect(script).toContain("process.exitCode");
  });

  it("falla cerrado: una entrada ilegible o un error interno bloquean", () => {
    expect(script).toContain("no es un JSON válido");
    expect(script).toContain("error interno del hook");
  });

  it("aplica las tres reglas: .env, fuera del proyecto y curl, wget y sudo", () => {
    expect(reglas).toContain('new Set(["curl", "wget", "sudo"])');
    expect(reglas).toContain('startsWith(".env")');
    expect(reglas).toContain("fuera de la carpeta del proyecto");
  });

  it("tiene al menos 10 pruebas con node:test y un script npm para correrlas", () => {
    const paquete: { scripts: Record<string, string> } = JSON.parse(
      leer("package.json"),
    );
    expect(pruebas).toContain('from "node:test"');
    expect(pruebas.match(/^test\(/gm)?.length).toBeGreaterThanOrEqual(10);
    expect(paquete.scripts["test:hook"]).toBe(
      "node --test scripts/ia/bloquear-acciones.test.mjs",
    );
  });

  it("Vitest no intenta ejecutar las pruebas de node:test", () => {
    expect(leer("vitest.config.ts")).toContain('"scripts/**"');
  });
});

describe("reto de IA · subagente revisor", () => {
  const revisor = leer("ia/propuestas/revisor.md");
  const [, cabecera = "", ...resto] = revisor.split("---");
  const prompt = resto.join("---");
  const campo = (nombre: string) =>
    new RegExp(`^${nombre}: (.+)$`, "m").exec(cabecera)?.[1] ?? "";
  const lista = (texto: string) => texto.split(",").map((t) => t.trim());

  it("tiene el frontmatter de un subagente", () => {
    expect(revisor.startsWith("---\n")).toBe(true);
    expect(campo("name")).toBe("revisor");
    expect(campo("description")).toMatch(/solo lectura/i);
  });

  it("es de solo lectura: ni Write ni Edit entre sus herramientas", () => {
    expect(lista(campo("tools"))).toEqual(["Read", "Grep", "Glob", "Bash"]);
    expect(lista(campo("disallowedTools"))).toEqual(
      expect.arrayContaining(["Write", "Edit"]),
    );
  });

  it("su prompt manda correr npm run check y revisar git diff contra AGENTS.md", () => {
    expect(prompt).toContain("npm run check");
    expect(prompt).toContain("git diff");
    expect(prompt).toContain("AGENTS.md");
    expect(prompt).toMatch(/no (creas|arreglas)/i);
  });
});

describe("documentación de los retos de IA", () => {
  it.each(["ia/CONFIGURACION.md", "ia/IA.md"])(
    "%s menciona el hook, sus pruebas y el subagente",
    (archivo) => {
      const texto = leer(archivo);
      expect(texto).toContain("scripts/ia/bloquear-acciones.mjs");
      expect(texto).toContain("ia/propuestas/revisor.md");
      expect(texto).toContain("test:hook");
    },
  );

  it("CONFIGURACION.md trae el bloque exacto para settings.json y cómo instalar el subagente", () => {
    const texto = leer("ia/CONFIGURACION.md");
    expect(texto).toContain('"PreToolUse"');
    expect(texto).toContain("${CLAUDE_PROJECT_DIR}");
    expect(texto).toContain(
      "cp ia/propuestas/revisor.md .claude/agents/revisor.md",
    );
    expect(texto).toContain("código de salida");
  });
});
