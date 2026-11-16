import { describe, expect, it } from "vitest";
import { leerCookie } from "@/lib/cookies";
import { mensajeDeErrorAuth } from "@/lib/mensajes-auth";
import { destinoSeguro } from "@/lib/navegacion";

describe("leerCookie", () => {
  it("encuentra la cookie pedida entre varias", () => {
    expect(leerCookie("a=1; sesion=x=y; b=2", "sesion")).toBe("x=y");
  });

  it("devuelve null si no hay cabecera o no está la cookie", () => {
    expect(leerCookie(null, "sesion")).toBeNull();
    expect(leerCookie("sesionx=1", "sesion")).toBeNull();
  });
});

describe("destinoSeguro (evita redirecciones abiertas)", () => {
  it.each([
    ["/proyectos/p1", "/proyectos/p1"],
    [null, "/proyectos"],
    ["https://malo.com", "/proyectos"],
    ["//malo.com", "/proyectos"],
    ["/\\malo.com", "/proyectos"],
  ])("%j → %s", (siguiente, esperado) => {
    expect(destinoSeguro(siguiente)).toBe(esperado);
  });
});

describe("mensajeDeErrorAuth", () => {
  it("traduce los códigos de Firebase Auth", () => {
    const error = { code: "auth/invalid-credential" };
    expect(mensajeDeErrorAuth(error)).toBe("Correo o contraseña incorrectos.");
    expect(mensajeDeErrorAuth({ code: "auth/email-already-in-use" })).toMatch(
      /ya existe/i,
    );
  });

  it("usa el mensaje de la API y un texto genérico en otros casos", () => {
    const deApi = Object.assign(new Error("Inicia sesión de nuevo"), {
      name: "ErrorApi",
    });
    expect(mensajeDeErrorAuth(deApi)).toBe("Inicia sesión de nuevo");
    expect(mensajeDeErrorAuth(new Error("interno"))).toMatch(/no se pudo/i);
    expect(mensajeDeErrorAuth({ code: "toString" })).toMatch(/no se pudo/i);
  });
});
