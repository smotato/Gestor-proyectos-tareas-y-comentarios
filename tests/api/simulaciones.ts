import type { Proyecto } from "@/schemas/proyecto";

/** Proyecto de ejemplo: u1 propietario, u2 editor, u3 lector. */
export function proyectoDePrueba(cambios: Partial<Proyecto> = {}): Proyecto {
  return {
    id: "p1",
    nombre: "Tablero de clase",
    propietarioUid: "u1",
    miembros: { u1: "propietario", u2: "editor", u3: "lector" },
    miembrosUids: ["u1", "u2", "u3"],
    creadoEn: "2026-11-16T10:00:00.000Z",
    ...cambios,
  };
}

/** Contexto de un Route Handler que conserva el tipo exacto de los params. */
export function conParams<T extends Record<string, string>>(
  params: T,
): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}

export function peticionJson(
  ruta: string,
  metodo: "POST" | "PATCH" | "DELETE",
  cuerpo?: unknown,
): Request {
  return new Request(`http://localhost:3000${ruta}`, {
    method: metodo,
    headers: { "content-type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
}
