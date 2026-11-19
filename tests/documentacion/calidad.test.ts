// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditoria,
  informesPorPagina,
  type InformeLighthouse,
  leerInforme,
  nota,
  valorMostrado,
} from "./informes-lighthouse";

const RAIZ = process.cwd();
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), "utf8");

const calidad = leer("CALIDAD.md");
const lineasDe = (texto: string) => texto.split("\n");
const aparicionesDe = (texto: string, palabra: string) =>
  texto.split(palabra).length - 1;

const celdas = (fila: string) =>
  fila
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
const sinNegrita = (texto: string) => texto.replaceAll("**", "");

// Metas de 14.1: Rendimiento ≥ 90 y las otras tres ≥ 95.
const CATEGORIAS = [
  ["performance", 90],
  ["accessibility", 95],
  ["best-practices", 95],
  ["seo", 95],
] as const;
const DISPOSITIVOS: Record<string, string> = {
  Móvil: "mobile",
  Escritorio: "desktop",
};

/** Una fila de la tabla de §3: sus 4 notas deben ser las del informe enlazado. */
function comprobarFilaLighthouse(fila: string) {
  const [pagina = "", , dispositivo = "", ...resto] = celdas(fila);
  const archivo = /\((calidad\/lighthouse\/[^)]+\.html)\)/.exec(fila)?.[1];
  expect(archivo, `la fila no enlaza un informe: ${fila}`).toBeDefined();
  const informe = leerInforme(archivo ?? "");
  expect(new URL(informe.finalDisplayedUrl).pathname).toBe(
    pagina.replaceAll("`", ""),
  );
  expect(informe.configSettings.formFactor).toBe(DISPOSITIVOS[dispositivo]);
  CATEGORIAS.forEach(([categoria, meta], i) => {
    const real = nota(informe, categoria);
    const marca = real >= meta ? "✓" : "✗";
    expect(sinNegrita(resto[i] ?? ""), `${archivo} · ${categoria}`).toBe(
      `${real} ${marca}`,
    );
  });
}

// Metas de 14.1 (TBT es la aproximación de INP en laboratorio).
const METRICAS = [
  ["largest-contentful-paint", 1, 2500],
  ["cumulative-layout-shift", 2, 0.1],
  ["total-blocking-time", 3, 200],
] as const;

/** Una fila de la tabla de §7: «móvil y escritorio» + marca de la meta. */
function comprobarMetricasDePagina(
  fila: string[],
  pagina: string,
  informes: Map<string, InformeLighthouse>,
) {
  const movil = informes.get(`${pagina}|mobile`);
  const escritorio = informes.get(`${pagina}|desktop`);
  expect(movil, `falta el informe móvil de ${pagina}`).toBeDefined();
  expect(
    escritorio,
    `falta el informe de escritorio de ${pagina}`,
  ).toBeDefined();
  if (!movil || !escritorio) return;
  for (const [id, columna, maximo] of METRICAS) {
    const cumple =
      (auditoria(movil, id).numericValue ?? Infinity) <= maximo &&
      (auditoria(escritorio, id).numericValue ?? Infinity) <= maximo;
    const esperado = `${valorMostrado(movil, id)} y ${valorMostrado(escritorio, id)} ${cumple ? "✓" : "✗"}`;
    expect(fila[columna], `${pagina} · ${id}`).toBe(esperado);
  }
}

/** Texto de la sección «## <n>. …» hasta la siguiente. */
function seccion(numero: number): string {
  const inicio = calidad.search(new RegExp(`^## ${numero}\\. `, "m"));
  expect(inicio).toBeGreaterThan(-1);
  const resto = calidad.slice(inicio + 1);
  const siguiente = resto.search(/^## /m);
  return siguiente === -1 ? resto : resto.slice(0, siguiente);
}

describe("CALIDAD.md · estructura (sección 14.6)", () => {
  it("tiene las ocho secciones, en orden", () => {
    const titulos = [...calidad.matchAll(/^## (\d)\. (.+)$/gm)].map(
      (m) => `${m[1]}. ${m[2]}`,
    );
    expect(titulos).toEqual([
      "1. Resumen",
      "2. Integración continua",
      "3. Lighthouse",
      "4. Capturas en 360, 768 y 1024 px",
      "5. axe y validador HTML",
      "6. Lista de comprobación manual",
      "7. Core Web Vitals",
      "8. Retos de excelencia elegidos",
    ]);
  });

  it("el resumen cubre cada requisito de 14.6 y dice si está hecho o pendiente", () => {
    const resumen = seccion(1);
    for (const requisito of [
      "Integración continua",
      "Lighthouse",
      "Capturas",
      "axe en Vitest",
      "axe en Playwright",
      "Validador HTML",
      "comprobación manual",
      "LCP, INP y CLS",
      "Retos elegidos",
      "Demostración en vivo",
    ]) {
      expect(resumen).toContain(requisito);
    }
    const filas = lineasDe(resumen).filter(
      (l) =>
        l.startsWith("|") &&
        !/^\|[\s|-]+$/.test(l) &&
        !l.includes("Requisito de 14.6"),
    );
    expect(filas).toHaveLength(10);
    for (const fila of filas) expect(fila).toMatch(/Hecho|Pendiente|Parcial/);
  });
});

describe("CALIDAD.md · integración continua y cobertura", () => {
  it("enlaza la ejecución de la CI y lista lo que corre", () => {
    const ci = seccion(2);
    expect(ci).toContain(
      "https://github.com/smotato/Gestor-proyectos-tareas-y-comentarios/actions/runs/44027305176",
    );
    for (const paso of [
      "npm ci",
      "npm run check",
      "npm run test:hook",
      "npm run build",
      "npm audit --audit-level=high",
    ]) {
      expect(ci).toContain(paso);
    }
  });

  it("explica cómo correr el check y la cobertura en local", () => {
    const ci = seccion(2);
    expect(ci).toContain("npm run test ");
    expect(ci).toContain("coverage/index.html");
    expect(ci).toContain("80 %");
    expect(ci).toContain("vitest.config.ts");
  });
});

describe("CALIDAD.md · mediciones sin cifras inventadas", () => {
  it("Lighthouse: 3 páginas en móvil y escritorio, con las metas y las notas de cada informe", () => {
    const lighthouse = seccion(3);
    expect(lighthouse).toContain("≥ 90");
    expect(lighthouse).toContain("≥ 95");
    expect(lighthouse).toContain("calidad/lighthouse/");
    const filas = lineasDe(lighthouse).filter(
      (l) => l.startsWith("|") && l.includes("calidad/lighthouse/"),
    );
    expect(filas).toHaveLength(6);
    for (const fila of filas) comprobarFilaLighthouse(fila);
    for (const pagina of ["`/`", "`/login`", "`/proyectos`"]) {
      expect(lighthouse).toContain(pagina);
    }
    // El texto puede partirse en dos líneas: se comparan los espacios normalizados.
    expect(lighthouse.replace(/\s+/g, " ")).toContain("Clear storage");
  });

  it("Core Web Vitals: LCP, CLS y TBT salen de los informes; INP sigue PENDIENTE; «antes» no se midió", () => {
    const vitals = seccion(7);
    for (const columna of ["Antes", "Después", "Qué se hizo"]) {
      expect(vitals).toContain(columna);
    }
    const informes = informesPorPagina();
    for (const pagina of ["/", "/login", "/proyectos"]) {
      const fila = lineasDe(vitals).find(
        (l) => celdas(l)[0] === `\`${pagina}\``,
      );
      expect(fila, `falta la fila de ${pagina}`).toBeDefined();
      comprobarMetricasDePagina(celdas(fila ?? ""), pagina, informes);
    }
    for (const metrica of ["LCP", "INP", "CLS"]) {
      const fila = lineasDe(vitals).find((l) => l.startsWith(`| ${metrica} `));
      expect(celdas(fila ?? "")[2]).toContain("No se midió");
    }
    const inp = lineasDe(vitals).find((l) => l.startsWith("| INP "));
    expect(aparicionesDe(inp ?? "", "PENDIENTE")).toBeGreaterThanOrEqual(1);
    expect(vitals).toContain("Interactions");
  });

  it("el validador HTML está enlazado y sin resultados", () => {
    const axe = seccion(5);
    expect(axe).toContain("https://validator.w3.org/nu/");
    expect(aparicionesDe(axe, "PENDIENTE")).toBeGreaterThanOrEqual(10);
  });
});

describe("CALIDAD.md · capturas y lista manual", () => {
  it("la tabla enlaza las nueve capturas y dice cómo generarlas", () => {
    const capturas = seccion(4);
    expect(capturas).toContain("npm run capturas");
    for (const pagina of ["portada", "login", "registro"]) {
      for (const ancho of [360, 768, 1024]) {
        expect(capturas).toContain(`calidad/capturas/${pagina}-${ancho}.png`);
      }
    }
  });

  it("la lista manual tiene 7 casillas sin marcar, cada una con fecha", () => {
    const lista = seccion(6);
    const casillas = lineasDe(lista).filter((l) => l.startsWith("- [ ]"));
    expect(casillas).toHaveLength(7);
    for (const prueba of [
      "Teclado",
      "Foco visible",
      "Saltar al contenido",
      "Zoom al 200 %",
      "Reflow a 320 px",
      "NVDA",
      "Modo oscuro",
    ]) {
      expect(casillas.some((c) => c.includes(prueba))).toBe(true);
    }
    expect(aparicionesDe(lista, "Fecha: ____")).toBe(7);
    expect(calidad).not.toMatch(/\[[xX]\]/);
  });
});

describe("CALIDAD.md · retos de excelencia", () => {
  it.each([
    ["Reto 1", "npm run test -- tests/accesibilidad"],
    ["Reto 2", "npm run e2e"],
    ["Reto 3", "npm run test -- tests/estilos"],
  ])("%s dice qué es, su evidencia y el comando exacto", (reto, comando) => {
    const retos = seccion(8);
    const inicio = retos.indexOf(`### ${reto} ·`);
    expect(inicio).toBeGreaterThan(-1);
    const siguiente = retos.indexOf("\n### ", inicio + 1);
    const texto = retos.slice(inicio, siguiente === -1 ? undefined : siguiente);
    expect(texto).toContain("**Qué es.**");
    expect(texto).toContain("**Evidencia.**");
    expect(texto).toContain("**Comando exacto.**");
    expect(texto).toContain(comando);
  });
});

describe("calidad/README.md", () => {
  it("es el índice de las carpetas y remite a CALIDAD.md", () => {
    const indice = leer("calidad/README.md");
    expect(indice).toContain("../CALIDAD.md");
    for (const carpeta of ["lighthouse/", "capturas/", "playwright-report/"]) {
      expect(indice).toContain(carpeta);
    }
  });
});

describe("script de capturas y pruebas de Playwright", () => {
  it("npm run capturas usa su propia configuración y e2e no lo ejecuta", () => {
    const paquete: { scripts: Record<string, string> } = JSON.parse(
      leer("package.json"),
    );
    expect(paquete.scripts.capturas).toBe(
      "playwright test --config=playwright.capturas.config.ts",
    );
    expect(paquete.scripts.e2e).toBe("playwright test");
    expect(leer("playwright.config.ts")).toContain("**/capturas/**");
    expect(leer("playwright.capturas.config.ts")).toContain("./e2e/capturas");
    expect(leer("vitest.config.ts")).toContain('"e2e/**"');
  });

  it("captura portada, login y registro y guarda <página>-<ancho>.png", () => {
    const spec = leer("e2e/capturas/capturas.spec.ts");
    for (const ruta of ['"/"', '"/login"', '"/registro"']) {
      expect(spec).toContain(`ruta: ${ruta}`);
    }
    expect(spec).toContain("calidad/capturas/${nombre}-${ancho}.png");
    expect(spec).toContain("fullPage: true");
  });

  it("se prueba en 360, 768 y 1024 px", () => {
    const config = leer("playwright.config.ts");
    for (const ancho of [360, 768, 1024]) {
      expect(config).toContain(`width: ${ancho}`);
    }
  });

  it("recorre la portada, el login y el registro con axe en los cuatro temas", () => {
    const spec = leer("e2e/accesibilidad.spec.ts");
    for (const ruta of ['"/"', '"/login"', '"/registro"']) {
      expect(spec).toContain(`ruta: ${ruta}`);
    }
    expect(spec).toContain("@axe-core/playwright");
    expect(spec.match(/colorScheme: "(light|dark)"/g)).toHaveLength(4);
    expect(spec).toContain('contrast: "more"');
  });
});
