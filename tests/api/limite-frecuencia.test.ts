// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { demasiadasSolicitudes } from "@/lib/errores";
import { manejar } from "@/lib/http";

/** Un Route Handler cualquiera envuelto con `manejar`, igual que los reales. */
const alcanzados = vi.fn();
const ruta = manejar(async () => {
  alcanzados();
  return new Response(null, { status: 204 });
});

const IP_A = "203.0.113.7";
const IP_B = "198.51.100.9";

function pedir(metodo: string, camino: string, ip = IP_A) {
  const peticion = new Request(`http://localhost:3000${camino}`, {
    method: metodo,
    headers: { "x-forwarded-for": ip },
  });
  return ruta(peticion, {});
}

/** Estados de `veces` peticiones seguidas; `camino` puede cambiar en cada una. */
async function rafaga(
  veces: number,
  metodo: string,
  camino: (i: number) => string,
  ip = IP_A,
): Promise<number[]> {
  const estados: number[] = [];
  for (let i = 0; i < veces; i += 1) {
    estados.push((await pedir(metodo, camino(i), ip)).status);
  }
  return estados;
}

describe("límite de frecuencia en las rutas de escritura", () => {
  it("la petición 61 en un minuto recibe 429 con { error } y Retry-After", async () => {
    const estados = await rafaga(61, "POST", () => "/api/proyectos");
    expect(estados.slice(0, 60).every((estado) => estado === 204)).toBe(true);
    expect(estados[60]).toBe(429);
    const respuesta = await pedir("POST", "/api/proyectos");
    expect(respuesta.status).toBe(429);
    expect(await respuesta.json()).toEqual({
      error: expect.stringMatching(/^Demasiadas solicitudes/),
    });
    const espera = Number(respuesta.headers.get("Retry-After"));
    expect(espera).toBeGreaterThanOrEqual(1);
    expect(espera).toBeLessThanOrEqual(60);
    expect(respuesta.headers.get("Cache-Control")).toBe("no-store");
  });

  it("al bloquear, la ruta ni siquiera se ejecuta", async () => {
    alcanzados.mockClear();
    await rafaga(65, "PATCH", () => "/api/proyectos/p1/tareas/t1");
    expect(alcanzados).toHaveBeenCalledTimes(60);
  });

  it("cambiar el id de la URL no da un contador nuevo", async () => {
    const estados = await rafaga(
      61,
      "POST",
      (i) => `/api/proyectos/p${i}/tareas`,
    );
    expect(estados[60]).toBe(429);
  });

  it("cada IP lleva su cuenta y las lecturas no se limitan", async () => {
    await rafaga(61, "POST", () => "/api/proyectos");
    expect((await pedir("POST", "/api/proyectos", IP_B)).status).toBe(204);
    const lecturas = await rafaga(200, "GET", () => "/api/proyectos");
    expect(lecturas.every((estado) => estado === 204)).toBe(true);
  });
});

describe("límite de frecuencia en autenticación e invitaciones", () => {
  it("la petición 11 a /api/auth/sesion recibe 429", async () => {
    const estados = await rafaga(11, "POST", () => "/api/auth/sesion");
    expect(estados.slice(0, 10).every((estado) => estado === 204)).toBe(true);
    expect(estados[10]).toBe(429);
  });

  it("también limita las lecturas de /api/auth/yo", async () => {
    const estados = await rafaga(11, "GET", () => "/api/auth/yo");
    expect(estados[9]).toBe(204);
    expect(estados[10]).toBe(429);
  });

  it("aceptar invitaciones: 10 por minuto aunque se pruebe un código distinto cada vez", async () => {
    const estados = await rafaga(
      11,
      "POST",
      (i) => `/api/invitaciones/codigo${i}/aceptar`,
    );
    expect(estados[9]).toBe(204);
    expect(estados[10]).toBe(429);
  });

  it("el error 429 lleva el tiempo de espera en el mensaje y en la cabecera", () => {
    const error = demasiadasSolicitudes(30);
    expect(error.status).toBe(429);
    expect(error.message).toContain("30 segundos");
    expect(error.cabeceras).toEqual({ "Retry-After": "30" });
  });
});
