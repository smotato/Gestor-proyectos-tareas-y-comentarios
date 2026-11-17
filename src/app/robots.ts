import type { MetadataRoute } from "next";
import { urlDelSitio } from "@/lib/sitio";

/** Los buscadores pueden entrar a las páginas públicas; la API y lo privado quedan fuera. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/proyectos", "/invitacion/"],
    },
    sitemap: `${urlDelSitio()}/sitemap.xml`,
  };
}
