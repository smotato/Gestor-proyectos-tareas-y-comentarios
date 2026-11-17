// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ipDe,
  LimitadorFrecuencia,
  reglaPara,
  rutaNormalizada,
} from "@/lib/limite-frecuencia";

const REGLA = { limite: 3, ventanaMs: 60_000 };

describe("LimitadorFrecuencia", () => {
  it("deja pasar hasta el límite y luego dice cuánto esperar", () => {
    let ahora = 0;
    const limitador = new LimitadorFrecuencia(() => ahora);
    const respuestas = [1, 2, 3, 4].map(() => limitador.consumir("ip", REGLA));
    expect(respuestas.map((r) => r.permitido)).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(respuestas[3]?.reintentarEnSeg).toBe(60);
    ahora = 20_000;
    expect(limitador.consumir("ip", REGLA).reintentarEnSeg).toBe(40);
  });

  it("reinicia la cuenta cuando termina la ventana", () => {
    let ahora = 0;
    const limitador = new LimitadorFrecuencia(() => ahora);
    for (let i = 0; i < 4; i += 1) limitador.consumir("ip", REGLA);
    ahora = 60_000;
    expect(limitador.consumir("ip", REGLA).permitido).toBe(true);
  });

  it("lleva una cuenta distinta por clave", () => {
    const limitador = new LimitadorFrecuencia(() => 0);
    for (let i = 0; i < 4; i += 1) limitador.consumir("a /api/x", REGLA);
    expect(limitador.consumir("a /api/x", REGLA).permitido).toBe(false);
    expect(limitador.consumir("b /api/x", REGLA).permitido).toBe(true);
    expect(limitador.consumir("a /api/y", REGLA).permitido).toBe(true);
  });
});

describe("LimitadorFrecuencia · tope de memoria", () => {
  it("no crece sin límite: borra lo vencido y, si hace falta, lo más antiguo", () => {
    let ahora = 0;
    const limitador = new LimitadorFrecuencia(() => ahora);
    const corta = { limite: 1, ventanaMs: 1000 };
    for (let i = 0; i < 5; i += 1) limitador.consumir(`vieja-${i}`, corta);
    ahora = 5000;
    for (let i = 0; i < 10_005; i += 1) limitador.consumir(`ip-${i}`, REGLA);
    expect(limitador.tamano).toBeLessThanOrEqual(10_000);
  });

  it("si todo está vigente, borra las claves más antiguas al llegar al tope", () => {
    const limitador = new LimitadorFrecuencia(() => 0);
    for (let i = 0; i < 10_005; i += 1) limitador.consumir(`ip-${i}`, REGLA);
    expect(limitador.tamano).toBeLessThanOrEqual(10_000);
  });

  it("reiniciar vacía los contadores", () => {
    const limitador = new LimitadorFrecuencia(() => 0);
    limitador.consumir("ip", REGLA);
    limitador.reiniciar();
    expect(limitador.tamano).toBe(0);
  });
});

describe("rutaNormalizada y reglaPara", () => {
  it("cambia los ids y códigos por :id para que no den contadores nuevos", () => {
    expect(rutaNormalizada("/api/proyectos/abc/tareas/xyz/comentarios")).toBe(
      "/api/proyectos/:id/tareas/:id/comentarios",
    );
    expect(rutaNormalizada("/api/auth/sesion")).toBe("/api/auth/sesion");
    expect(rutaNormalizada("/api/invitaciones/Zm9v/aceptar")).toBe(
      "/api/invitaciones/:id/aceptar",
    );
  });

  it("limita a 10 por minuto la autenticación y aceptar invitaciones", () => {
    const estricta = { limite: 10, ventanaMs: 60_000 };
    expect(reglaPara("POST", "/api/auth/sesion")).toEqual(estricta);
    expect(reglaPara("GET", "/api/auth/yo")).toEqual(estricta);
    expect(reglaPara("POST", "/api/invitaciones/:id/aceptar")).toEqual(
      estricta,
    );
  });

  it("limita a 60 por minuto las escrituras y no limita las lecturas", () => {
    const escritura = { limite: 60, ventanaMs: 60_000 };
    for (const metodo of ["POST", "PATCH", "DELETE"]) {
      expect(reglaPara(metodo, "/api/proyectos/:id/tareas")).toEqual(escritura);
    }
    expect(reglaPara("GET", "/api/proyectos")).toBeNull();
  });
});

describe("ipDe", () => {
  const con = (cabeceras: Record<string, string>) =>
    new Request("http://localhost/api/x", { headers: cabeceras });

  it("usa la primera IP de x-forwarded-for", () => {
    const request = con({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(ipDe(request)).toBe("203.0.113.7");
  });

  it("usa x-real-ip y, sin cabeceras, una clave común", () => {
    expect(ipDe(con({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(ipDe(con({}))).toBe("desconocida");
  });

  it("recorta valores enormes para no llenar la memoria", () => {
    expect(ipDe(con({ "x-forwarded-for": "9".repeat(500) }))).toHaveLength(64);
  });
});
