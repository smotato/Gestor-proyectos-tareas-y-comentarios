// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";

/** Cabeceras que Next aplicaría hoy a `/`, por nombre. */
async function cabeceras(): Promise<Record<string, string>> {
  if (!nextConfig.headers) throw new Error("next.config no define headers()");
  const reglas = await nextConfig.headers();
  expect(reglas).toHaveLength(1);
  expect(reglas[0]?.source).toBe("/:path*");
  const encabezados = reglas[0]?.headers ?? [];
  const entradas = encabezados.map((h): [string, string] => [h.key, h.value]);
  return Object.fromEntries(entradas);
}

function directivas(csp: string | undefined): Map<string, string> {
  const partes = (csp ?? "").split(";").map((parte) => parte.trim());
  return new Map(
    partes.filter(Boolean).map((parte): [string, string] => {
      const [nombre = "", ...valores] = parte.split(" ");
      return [nombre, valores.join(" ")];
    }),
  );
}

afterEach(() => vi.unstubAllEnvs());

describe("cabeceras de seguridad", () => {
  it("evita que el navegador adivine el tipo y limita el Referer", async () => {
    const encabezados = await cabeceras();
    expect(encabezados["X-Content-Type-Options"]).toBe("nosniff");
    expect(encabezados["Referrer-Policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("en producción el CSP permite solo lo que usa la app y Firebase Auth", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = directivas((await cabeceras())["Content-Security-Policy"]);
    expect(csp.get("default-src")).toBe("'self'");
    const conexiones = csp.get("connect-src") ?? "";
    expect(conexiones).toContain("'self'");
    expect(conexiones).toContain("https://identitytoolkit.googleapis.com");
    expect(conexiones).toContain("https://securetoken.googleapis.com");
    expect(conexiones).not.toMatch(/9099|ws:/);
    expect(csp.get("script-src")).not.toContain("unsafe-eval");
  });

  it("en producción cierra objetos, marcos y formularios externos y sube a HTTPS", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = directivas((await cabeceras())["Content-Security-Policy"]);
    expect(csp.get("object-src")).toBe("'none'");
    expect(csp.get("frame-ancestors")).toBe("'none'");
    expect(csp.get("base-uri")).toBe("'self'");
    expect(csp.get("form-action")).toBe("'self'");
    expect(csp.has("upgrade-insecure-requests")).toBe(true);
  });

  it("en desarrollo permite los emuladores, eval de React y no fuerza HTTPS", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const csp = directivas((await cabeceras())["Content-Security-Policy"]);
    expect(csp.get("connect-src")).toContain("http://127.0.0.1:9099");
    expect(csp.get("script-src")).toContain("'unsafe-eval'");
    expect(csp.has("upgrade-insecure-requests")).toBe(false);
  });
});
