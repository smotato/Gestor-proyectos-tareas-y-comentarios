// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Mantiene `openapi.yaml` sincronizado con `src/app/api` sin necesitar un
 * lector de YAML: el documento se revisa por líneas (sangría de 2 espacios).
 */

const RAIZ = process.cwd();
const yaml = readFileSync(join(RAIZ, "openapi.yaml"), "utf8");
const lineas = yaml.split("\n");

interface RutaDelCodigo {
  camino: string;
  metodos: string[];
}

function rutasDelCodigo(): RutaDelCodigo[] {
  const base = join(RAIZ, "src/app/api");
  const archivos = readdirSync(base, { recursive: true })
    .map(String)
    .filter((archivo) => archivo.endsWith("route.ts"));
  return archivos.map((archivo) => {
    const carpetas = archivo.replace(/route\.ts$/, "").split(/[\\/]/);
    const camino = ["/api", ...carpetas.filter(Boolean)].join("/");
    const fuente = readFileSync(join(base, archivo), "utf8");
    const exportados = fuente.matchAll(
      /export const (GET|POST|PATCH|PUT|DELETE)\b/g,
    );
    const metodos = [...exportados].map((m) => (m[1] ?? "").toLowerCase());
    return {
      camino: camino.replace(/\[([^\]]+)\]/g, "{$1}"),
      metodos: metodos.sort(),
    };
  });
}

/** Líneas que cuelgan de `encabezado` (hasta la siguiente línea con menos sangría). */
function bloqueDe(encabezado: string, sangria: number): string[] {
  const inicio = lineas.indexOf(encabezado);
  if (inicio === -1) return [];
  const resto = lineas.slice(inicio + 1);
  const fin = resto.findIndex(
    (l) => l.trim() !== "" && !l.startsWith(" ".repeat(sangria + 1)),
  );
  return fin === -1 ? resto : resto.slice(0, fin);
}

function metodosDocumentados(camino: string): string[] {
  const bloque = bloqueDe(`  ${camino}:`, 2).join("\n");
  const metodos = bloque.matchAll(/^ {4}(get|post|put|patch|delete):/gm);
  return [...metodos].map((m) => m[1] ?? "").sort();
}

function nombresDe(seccion: string): Set<string> {
  const nombres = bloqueDe(`  ${seccion}:`, 2).map(
    (l) => /^ {4}([A-Za-z][\w-]*):/.exec(l)?.[1],
  );
  return new Set(nombres.filter((n): n is string => n !== undefined));
}

describe("openapi.yaml", () => {
  it("es OpenAPI 3.1 y describe el formato de error { error, detalles? }", () => {
    expect(yaml).toMatch(/^openapi: 3\.1\.\d+$/m);
    const esquemaError = bloqueDe("    Error:", 4).join("\n");
    expect(esquemaError).toContain("required: [error]");
    expect(esquemaError).toContain("detalles:");
  });

  it("documenta cada ruta y cada método de src/app/api", () => {
    const rutas = rutasDelCodigo();
    expect(rutas.length).toBeGreaterThanOrEqual(12);
    for (const { camino, metodos } of rutas) {
      expect({ camino, metodos: metodosDocumentados(camino) }).toEqual({
        camino,
        metodos,
      });
    }
  });

  it("no documenta rutas que no existen en el código", () => {
    const delCodigo = new Set(rutasDelCodigo().map((r) => r.camino));
    const documentadas = lineas
      .map((l) => /^ {2}(\/api\/\S*):$/.exec(l)?.[1])
      .filter((camino): camino is string => camino !== undefined);
    expect(documentadas.length).toBe(delCodigo.size);
    for (const camino of documentadas) expect(delCodigo.has(camino)).toBe(true);
  });
});

describe("openapi.yaml · referencias y errores", () => {
  it("todos los $ref apuntan a algo definido en components", () => {
    const refs = [
      ...yaml.matchAll(/\$ref: ["']#\/components\/(\w+)\/([\w-]+)["']/g),
    ];
    expect(refs.length).toBeGreaterThan(20);
    for (const [, seccion = "", nombre = ""] of refs) {
      expect({
        seccion,
        nombre,
        existe: nombresDe(seccion).has(nombre),
      }).toEqual({
        seccion,
        nombre,
        existe: true,
      });
    }
  });

  it.each(["400", "401", "403", "404", "409", "410", "429"])(
    "documenta el código de error %s",
    (codigo) => {
      expect(yaml).toMatch(new RegExp(`^\\s+["']?${codigo}["']?:`, "m"));
    },
  );
});
