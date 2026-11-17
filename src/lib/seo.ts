import type { Metadata } from "next";
import { urlDelSitio } from "./sitio";

export const NOMBRE_DEL_SITIO = "Gestor de proyectos";

export const DESCRIPCION_DEL_SITIO =
  "Proyectos con miembros, tareas asignadas, estados y comentarios, con permisos por rol.";

/** Páginas que se pueden ver sin sesión y se indexan; el sitemap las lista. */
export const RUTAS_PUBLICAS = ["/", "/login", "/registro"] as const;

/** Las páginas privadas (proyectos, invitaciones) no deben aparecer en buscadores. */
export const SIN_INDEXAR: Metadata["robots"] = { index: false, follow: false };

/**
 * Metadatos de toda la app: título con plantilla («%s · Gestor de proyectos»),
 * descripción y Open Graph básico. Cada página pone su propio `title`.
 */
export function metadatosDelSitio(): Metadata {
  return {
    metadataBase: new URL(urlDelSitio()),
    title: {
      default: NOMBRE_DEL_SITIO,
      template: `%s · ${NOMBRE_DEL_SITIO}`,
    },
    description: DESCRIPCION_DEL_SITIO,
    openGraph: {
      type: "website",
      siteName: NOMBRE_DEL_SITIO,
      title: NOMBRE_DEL_SITIO,
      description: DESCRIPCION_DEL_SITIO,
      locale: "es_LA",
      url: "/",
    },
    twitter: { card: "summary" },
  };
}
