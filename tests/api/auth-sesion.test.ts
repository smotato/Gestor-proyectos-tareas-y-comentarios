// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  verifySessionCookie: vi.fn(),
  createSessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
}));
vi.mock("@/lib/firebase/admin", () => ({ authAdmin: () => auth }));

import { DELETE, POST } from "@/app/api/auth/sesion/route";

const SITIO = "http://localhost:3000";
const CINCO_DIAS_SEG = 5 * 24 * 60 * 60;

function peticion(
  metodo: "POST" | "DELETE",
  cuerpo?: string,
  cabeceras: Record<string, string> = {},
): Request {
  return new Request(`${SITIO}/api/auth/sesion`, {
    method: metodo,
    headers: {
      origin: SITIO,
      "content-type": "application/json",
      ...cabeceras,
    },
    body: cuerpo,
  });
}

const enviar = (cuerpo: string, cabeceras?: Record<string, string>) =>
  POST(peticion("POST", cuerpo, cabeceras), {});

beforeEach(() => vi.resetAllMocks());

describe("POST /api/auth/sesion · 400 y 415", () => {
  it("sin idToken responde 400 con detalle del campo", async () => {
    const respuesta = await enviar("{}");
    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({
      error: expect.any(String),
      detalles: [{ campo: "idToken", mensaje: expect.any(String) }],
    });
  });

  it("con campos desconocidos o JSON roto responde 400", async () => {
    const extra = await enviar(JSON.stringify({ idToken: "t", uid: "otro" }));
    const roto = await enviar("{no es json");
    expect(extra.status).toBe(400);
    expect(roto.status).toBe(400);
    expect(auth.verifyIdToken).not.toHaveBeenCalled();
  });

  it("si el cuerpo no es JSON responde 415", async () => {
    const respuesta = await enviar("idToken=t", {
      "content-type": "text/plain",
    });
    expect(respuesta.status).toBe(415);
  });
});

describe("POST /api/auth/sesion · sesión y CSRF", () => {
  it("con login reciente crea la cookie HttpOnly y responde 204", async () => {
    const ahora = Math.floor(Date.now() / 1000);
    auth.verifyIdToken.mockResolvedValue({ uid: "u1", auth_time: ahora - 10 });
    auth.createSessionCookie.mockResolvedValue("cookie-falsa");
    const respuesta = await enviar(JSON.stringify({ idToken: "t" }));
    expect(respuesta.status).toBe(204);
    const cookie = respuesta.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("sesion=cookie-falsa");
    for (const atributo of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]) {
      expect(cookie).toContain(atributo);
    }
    expect(cookie).toContain(`Max-Age=${CINCO_DIAS_SEG}`);
    expect(auth.createSessionCookie).toHaveBeenCalledWith("t", {
      expiresIn: CINCO_DIAS_SEG * 1000,
    });
  });

  it("si el inicio de sesión no es reciente responde 401", async () => {
    auth.verifyIdToken.mockResolvedValue({ uid: "u1", auth_time: 0 });
    const respuesta = await enviar(JSON.stringify({ idToken: "t" }));
    expect(respuesta.status).toBe(401);
    expect(auth.createSessionCookie).not.toHaveBeenCalled();
  });

  it("con un idToken inválido responde 401", async () => {
    const error = Object.assign(new Error("x"), {
      code: "auth/argument-error",
    });
    auth.verifyIdToken.mockRejectedValue(error);
    const respuesta = await enviar(JSON.stringify({ idToken: "t" }));
    expect(respuesta.status).toBe(401);
  });

  it("con un Origin de otro sitio responde 403 sin tocar Firebase", async () => {
    const cuerpo = JSON.stringify({ idToken: "t" });
    const respuesta = await enviar(cuerpo, { origin: "https://malo.com" });
    expect(respuesta.status).toBe(403);
    expect(auth.verifyIdToken).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/auth/sesion", () => {
  it("borra la cookie, revoca los tokens y responde 204", async () => {
    auth.verifySessionCookie.mockResolvedValue({ uid: "u1", auth_time: 0 });
    const respuesta = await DELETE(
      peticion("DELETE", undefined, { cookie: "sesion=abc" }),
      {},
    );
    expect(respuesta.status).toBe(204);
    expect(respuesta.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(auth.revokeRefreshTokens).toHaveBeenCalledWith("u1");
  });

  it("con cookie de sesión pero sin Origin responde 403", async () => {
    const request = new Request(`${SITIO}/api/auth/sesion`, {
      method: "DELETE",
      headers: { cookie: "sesion=abc" },
    });
    expect((await DELETE(request, {})).status).toBe(403);
  });
});
