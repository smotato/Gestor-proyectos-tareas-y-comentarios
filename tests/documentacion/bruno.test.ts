// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La colección de Bruno cubre lo que pide la sección 9.6 de requisitos. */

const BRUNO = join(process.cwd(), "bruno");
const METODOS_QUE_MODIFICAN = ["post", "patch", "delete"];

interface Peticion {
  archivo: string;
  metodo: string;
  url: string;
  estado: number;
  texto: string;
}

function peticionesDe(carpeta: string): Peticion[] {
  return readdirSync(join(BRUNO, carpeta))
    .filter((archivo) => archivo.endsWith(".bru") && archivo !== "folder.bru")
    .map((archivo) => {
      const texto = readFileSync(join(BRUNO, carpeta, archivo), "utf8");
      const metodo = /^(get|post|patch|delete) \{$/m.exec(texto)?.[1] ?? "";
      const url = /^ {2}url: (.+)$/m.exec(texto)?.[1] ?? "";
      const estado = Number(/res\.status: eq (\d+)/.exec(texto)?.[1]);
      return { archivo: `${carpeta}/${archivo}`, metodo, url, estado, texto };
    });
}

const CARPETAS = readdirSync(BRUNO, { withFileTypes: true })
  .filter((entrada) => entrada.isDirectory() && /^\d\d-/.test(entrada.name))
  .map((entrada) => entrada.name);
const TODAS = CARPETAS.flatMap(peticionesDe);

describe("colección de Bruno", () => {
  it.each([
    "02-proyectos",
    "03-miembros",
    "04-tareas",
    "05-comentarios",
    "06-invitaciones",
  ])(
    "%s tiene un caso exitoso, un 400, un 401 y un 403 o un 404",
    (carpeta) => {
      const estados = peticionesDe(carpeta).map((p) => p.estado);
      expect(estados.some((estado) => estado >= 200 && estado < 300)).toBe(
        true,
      );
      expect(estados).toContain(400);
      expect(estados).toContain(401);
      expect(estados.includes(403) || estados.includes(404)).toBe(true);
    },
  );

  it("«Iniciar sesión» es POST /api/auth/sesion con Authorization: Bearer {{idToken}}", () => {
    const inicio = peticionesDe("01-autenticacion").find((p) =>
      p.archivo.endsWith("/iniciar-sesion.bru"),
    );
    expect(inicio?.metodo).toBe("post");
    expect(inicio?.url).toBe("{{baseUrl}}/api/auth/sesion");
    expect(inicio?.texto).toContain("auth:bearer {\n  token: {{idToken}}\n}");
    expect(inicio?.estado).toBe(204);
  });
});

describe("colección de Bruno · formato", () => {
  it("todas las peticiones usan {{baseUrl}} y las que modifican datos envían Origin", () => {
    expect(TODAS.length).toBeGreaterThan(30);
    for (const peticion of TODAS) {
      expect(peticion.url.startsWith("{{baseUrl}}/api/")).toBe(true);
      expect(Number.isInteger(peticion.estado)).toBe(true);
      if (METODOS_QUE_MODIFICAN.includes(peticion.metodo)) {
        expect(peticion.texto).toMatch(/^ {2}Origin: .+$/m);
      }
    }
  });

  it("el entorno local apunta a localhost:3000 y no guarda el idToken", () => {
    const entorno = readFileSync(join(BRUNO, "environments/local.bru"), "utf8");
    expect(entorno).toContain("baseUrl: http://localhost:3000");
    expect(entorno).toMatch(/vars:secret \[\n {2}idToken\n\]/);
    expect(entorno).not.toMatch(/^ {2}idToken:/m);
  });
});
