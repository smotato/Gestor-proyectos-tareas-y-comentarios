import type { MetadataRoute } from "next";
import { RUTAS_PUBLICAS } from "@/lib/seo";
import { urlDelSitio } from "@/lib/sitio";

type Entrada = MetadataRoute.Sitemap[number];

/**
 * Solo las páginas públicas. No lleva `lastModified`: con `cacheComponents`,
 * leer la fecha actual al generar el sitemap hace fallar la compilación.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlDelSitio();
  return RUTAS_PUBLICAS.map((ruta): Entrada => ({
    url: ruta === "/" ? base : `${base}${ruta}`,
    changeFrequency: "monthly",
    priority: ruta === "/" ? 1 : 0.5,
  }));
}
