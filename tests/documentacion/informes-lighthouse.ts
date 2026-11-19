// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

/** Solo los campos del informe que usan las pruebas de CALIDAD.md. */
const Informe = z.object({
  finalDisplayedUrl: z.string(),
  configSettings: z.object({ formFactor: z.string() }),
  categories: z.record(z.string(), z.object({ score: z.number() })),
  audits: z.record(
    z.string(),
    z.object({
      displayValue: z.string().optional(),
      numericValue: z.number().optional(),
    }),
  ),
});

export type InformeLighthouse = z.infer<typeof Informe>;

export const CARPETA_INFORMES = "calidad/lighthouse";
const MARCA = "window.__LIGHTHOUSE_JSON__ =";

/** Lee el JSON que Lighthouse incrusta en su informe HTML. */
export function leerInforme(ruta: string): InformeLighthouse {
  const html = readFileSync(join(process.cwd(), ruta), "utf8");
  const inicio = html.indexOf(MARCA);
  if (inicio === -1) throw new Error(`${ruta}: no contiene ${MARCA}`);
  const desde = inicio + MARCA.length;
  const json = html.slice(desde, html.indexOf("</script>", desde));
  return Informe.parse(JSON.parse(json.trim().replace(/;$/, "")));
}

/** Todos los informes de la carpeta, por «ruta|dispositivo» (p. ej. «/login|mobile»). */
export function informesPorPagina(): Map<string, InformeLighthouse> {
  const mapa = new Map<string, InformeLighthouse>();
  const carpeta = join(process.cwd(), CARPETA_INFORMES);
  for (const nombre of readdirSync(carpeta).filter((n) =>
    n.endsWith(".html"),
  )) {
    const informe = leerInforme(`${CARPETA_INFORMES}/${nombre}`);
    const ruta = new URL(informe.finalDisplayedUrl).pathname;
    mapa.set(`${ruta}|${informe.configSettings.formFactor}`, informe);
  }
  return mapa;
}

/** Nota de 0 a 100 de una categoría. */
export function nota(informe: InformeLighthouse, categoria: string): number {
  const dato = informe.categories[categoria];
  if (!dato) throw new Error(`Falta la categoría ${categoria}`);
  return Math.round(dato.score * 100);
}

export function auditoria(informe: InformeLighthouse, id: string) {
  const dato = informe.audits[id];
  if (!dato) throw new Error(`Falta la auditoría ${id}`);
  return dato;
}

/** Valor mostrado por Lighthouse, escrito como en CALIDAD.md (coma decimal). */
export function valorMostrado(informe: InformeLighthouse, id: string): string {
  const texto = auditoria(informe, id).displayValue ?? "";
  return texto.replace(/ /g, " ").replace(".", ",");
}
