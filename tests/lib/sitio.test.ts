// @vitest-environment node
import { describe, expect, it } from "vitest";
import { urlDelSitio } from "@/lib/sitio";

describe("urlDelSitio", () => {
  it("usa SITE_URL y le quita las barras del final", () => {
    const entorno = { SITE_URL: "https://gestor.example///" };
    expect(urlDelSitio(entorno)).toBe("https://gestor.example");
  });

  it("sin SITE_URL usa el dominio de producción que expone Vercel", () => {
    const entorno = { VERCEL_PROJECT_PRODUCTION_URL: "gestor.vercel.app" };
    expect(urlDelSitio(entorno)).toBe("https://gestor.vercel.app");
  });

  it("SITE_URL tiene prioridad sobre el dominio de Vercel", () => {
    const entorno = {
      SITE_URL: "https://gestor.example",
      VERCEL_PROJECT_PRODUCTION_URL: "gestor.vercel.app",
    };
    expect(urlDelSitio(entorno)).toBe("https://gestor.example");
  });

  it("sin nada, o con valores en blanco, usa localhost", () => {
    expect(urlDelSitio({})).toBe("http://localhost:3000");
    const enBlanco = { SITE_URL: "  ", VERCEL_PROJECT_PRODUCTION_URL: " " };
    expect(urlDelSitio(enBlanco)).toBe("http://localhost:3000");
  });
});
