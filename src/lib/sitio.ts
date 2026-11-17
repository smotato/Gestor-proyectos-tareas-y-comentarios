const URL_LOCAL = "http://localhost:3000";

type Entorno = Readonly<Record<string, string | undefined>>;

/**
 * Dirección pública del sitio, para Open Graph, `robots` y `sitemap`.
 * Orden: `SITE_URL` (si tienes un dominio propio) → el dominio de producción
 * que Vercel ya expone en `VERCEL_PROJECT_PRODUCTION_URL` → localhost.
 */
export function urlDelSitio(entorno: Entorno = process.env): string {
  const propia = entorno.SITE_URL?.trim();
  if (propia) return propia.replace(/\/+$/, "");
  const vercel = entorno.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : URL_LOCAL;
}
