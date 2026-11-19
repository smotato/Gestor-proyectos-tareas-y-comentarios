import { describe, expect, it } from "vitest";
import { estaVencida, hoyUtc } from "@/lib/tareas-ui";

describe("hoyUtc", () => {
  it("devuelve el día de hoy como AAAA-MM-DD", () => {
    expect(hoyUtc()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("estaVencida", () => {
  const hoy = "2026-11-19";

  it("es vencida si el día ya pasó y la tarea no está hecha", () => {
    expect(estaVencida("2026-11-18", "pendiente", hoy)).toBe(true);
    expect(estaVencida("2026-11-01", "enProgreso", hoy)).toBe(true);
  });

  it("no es vencida si vence hoy o más adelante", () => {
    expect(estaVencida("2026-11-19", "pendiente", hoy)).toBe(false);
    expect(estaVencida("2026-12-01", "pendiente", hoy)).toBe(false);
  });

  it("no es vencida si está hecha o no tiene fecha", () => {
    expect(estaVencida("2026-11-01", "hecha", hoy)).toBe(false);
    expect(estaVencida(null, "pendiente", hoy)).toBe(false);
  });
});
