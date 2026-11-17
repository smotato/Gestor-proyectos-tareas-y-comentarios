// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  DESCRIPCION_DEL_SITIO,
  metadatosDelSitio,
  RUTAS_PUBLICAS,
  SIN_INDEXAR,
} from "@/lib/seo";

const SITIO = "https://gestor.example";
const APP = join(process.cwd(), "src/app");

beforeEach(() => vi.stubEnv("SITE_URL", SITIO));
afterEach(() => vi.unstubAllEnvs());

describe("metadatos del sitio", () => {
  it("define título con plantilla y una descripción de tamaño razonable", () => {
    const metadatos = metadatosDelSitio();
    expect(metadatos.title).toEqual({
      default: "Gestor de proyectos",
      template: "%s · Gestor de proyectos",
    });
    expect(metadatos.description).toBe(DESCRIPCION_DEL_SITIO);
    expect(DESCRIPCION_DEL_SITIO.length).toBeLessThanOrEqual(160);
  });

  it("incluye Open Graph básico y la base para resolver URLs relativas", () => {
    const metadatos = metadatosDelSitio();
    expect(String(metadatos.metadataBase)).toBe(`${SITIO}/`);
    expect(metadatos.openGraph).toMatchObject({
      type: "website",
      siteName: "Gestor de proyectos",
      title: "Gestor de proyectos",
      description: DESCRIPCION_DEL_SITIO,
      locale: "es_LA",
    });
    expect(metadatos.twitter).toMatchObject({ card: "summary" });
  });

  it("las páginas privadas no se indexan", () => {
    expect(SIN_INDEXAR).toEqual({ index: false, follow: false });
  });
});

describe("robots y sitemap", () => {
  it("robots.txt deja entrar a lo público y cierra la API y lo privado", () => {
    const resultado = robots();
    expect(resultado.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/proyectos", "/invitacion/"],
    });
    expect(resultado.sitemap).toBe(`${SITIO}/sitemap.xml`);
  });

  it("el sitemap lista solo las páginas públicas, con URL absoluta", () => {
    const urls = sitemap().map((entrada) => entrada.url);
    expect(urls).toEqual([SITIO, `${SITIO}/login`, `${SITIO}/registro`]);
    expect(urls.some((url) => /proyectos|invitacion|api/.test(url))).toBe(
      false,
    );
  });

  it("cada ruta pública del sitemap tiene su página", () => {
    for (const ruta of RUTAS_PUBLICAS) {
      const carpeta = ruta === "/" ? "" : ruta;
      const archivo = join(APP, carpeta, "page.tsx");
      expect(readFileSync(archivo, "utf8")).toContain("export default");
    }
  });
});

interface Pagina {
  ruta: string;
  fuente: string;
  metadatos: string;
}

function paginas(): Pagina[] {
  const archivos = readdirSync(APP, { recursive: true })
    .map(String)
    .filter((archivo) => /(^|[\\/])page\.tsx$/.test(archivo));
  return archivos.map((ruta) => {
    const fuente = readFileSync(join(APP, ruta), "utf8");
    const metadatos =
      /export const metadata[\s\S]*?\n\};/.exec(fuente)?.[0] ?? "";
    return { ruta, fuente, metadatos };
  });
}

const tituloDe = (pagina: Pagina) =>
  /title:\s*(?:\{\s*absolute:\s*)?"([^"]+)"/.exec(pagina.metadatos)?.[1];

describe("metadata de cada página", () => {
  it("todas las páginas definen un title y ninguno se repite", () => {
    const todas = paginas();
    expect(todas).toHaveLength(8);
    const titulos = todas.map(tituloDe);
    expect(titulos.every((titulo) => titulo !== undefined)).toBe(true);
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  it("las páginas privadas llevan robots: SIN_INDEXAR", () => {
    const privadas = paginas().filter((p) =>
      /^(proyectos|invitacion)[\\/]/.test(p.ruta),
    );
    expect(privadas).toHaveLength(5);
    for (const pagina of privadas) {
      expect(pagina.metadatos).toContain("robots: SIN_INDEXAR");
    }
  });

  it("las páginas públicas llevan description y no se bloquean", () => {
    const publicas = paginas().filter(
      (p) => !/^(proyectos|invitacion)[\\/]/.test(p.ruta),
    );
    expect(publicas).toHaveLength(3);
    for (const pagina of publicas) {
      expect(pagina.metadatos).toContain("description:");
      expect(pagina.metadatos).not.toContain("robots");
    }
  });

  it("el layout usa los metadatos compartidos", () => {
    const layout = readFileSync(join(APP, "layout.tsx"), "utf8");
    expect(layout).toContain("metadatosDelSitio()");
  });
});
