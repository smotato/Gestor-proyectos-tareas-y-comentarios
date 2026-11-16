// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  verifySessionCookie: vi.fn(),
  verifyIdToken: vi.fn(),
}));
vi.mock("@/lib/firebase/admin", () => ({ authAdmin: () => auth }));

import { GET } from "@/app/api/auth/yo/route";

const URL_YO = "http://localhost:3000/api/auth/yo";
const token = { uid: "u1", email: "ana@ejemplo.com", auth_time: 0 };
const errorAuth = Object.assign(new Error("revocada"), {
  code: "auth/session-cookie-revoked",
});

const pedir = (cabeceras: Record<string, string> = {}) =>
  GET(new Request(URL_YO, { headers: cabeceras }), {});

beforeEach(() => vi.resetAllMocks());

describe("GET /api/auth/yo · 401", () => {
  it("sin cookie ni token responde 401 con { error } y no-store", async () => {
    const respuesta = await pedir();
    expect(respuesta.status).toBe(401);
    expect(respuesta.headers.get("cache-control")).toBe("no-store");
    const cuerpo: unknown = await respuesta.json();
    expect(cuerpo).toEqual({ error: expect.any(String) });
  });

  it("con una cookie revocada o inválida responde 401", async () => {
    auth.verifySessionCookie.mockRejectedValue(errorAuth);
    const respuesta = await pedir({ cookie: "sesion=vieja" });
    expect(respuesta.status).toBe(401);
    expect(auth.verifySessionCookie).toHaveBeenCalledWith("vieja", true);
  });

  it("con un Bearer inválido responde 401", async () => {
    auth.verifyIdToken.mockRejectedValue(errorAuth);
    const respuesta = await pedir({ authorization: "Bearer malo" });
    expect(respuesta.status).toBe(401);
  });
});

describe("GET /api/auth/yo · 200 y 500", () => {
  it("con cookie de sesión válida devuelve el usuario", async () => {
    auth.verifySessionCookie.mockResolvedValue({ ...token, rol: "editor" });
    const respuesta = await pedir({ cookie: "otra=1; sesion=buena" });
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      usuario: { uid: "u1", correo: "ana@ejemplo.com", rol: "editor" },
    });
  });

  it("acepta Authorization: Bearer para Bruno o Postman", async () => {
    auth.verifyIdToken.mockResolvedValue(token);
    const respuesta = await pedir({ authorization: "Bearer bueno" });
    expect(respuesta.status).toBe(200);
    expect(auth.verifyIdToken).toHaveBeenCalledWith("bueno", true);
  });

  it("un fallo que no es de autenticación responde 500 sin detalles", async () => {
    const consola = vi.spyOn(console, "error").mockImplementation(() => {});
    auth.verifySessionCookie.mockRejectedValue(new Error("sin conexión"));
    const respuesta = await pedir({ cookie: "sesion=x" });
    expect(respuesta.status).toBe(500);
    expect(await respuesta.json()).toEqual({ error: expect.any(String) });
    expect(respuesta.headers.get("x-request-id")).toBeTruthy();
    consola.mockRestore();
  });
});
