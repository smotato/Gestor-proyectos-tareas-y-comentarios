/** Llamadas del navegador a la API propia (mismo origen). */

export class ErrorApi extends Error {
  readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status;
  }
}

/** Convierte una respuesta no exitosa en ErrorApi con el `error` del cuerpo. */
export async function lanzarSiFalla(respuesta: Response): Promise<void> {
  if (respuesta.ok) return;
  let mensaje = `Error ${respuesta.status}`;
  try {
    const cuerpo: unknown = await respuesta.json();
    const texto: unknown =
      typeof cuerpo === "object" && cuerpo !== null
        ? Reflect.get(cuerpo, "error")
        : undefined;
    if (typeof texto === "string") mensaje = texto;
  } catch {
    // Cuerpo vacío o no JSON: se queda el mensaje con el código.
  }
  throw new ErrorApi(respuesta.status, mensaje);
}

interface OpcionesPedido {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function pedirApi(
  ruta: string,
  { method, body }: OpcionesPedido = { method: "GET" },
): Promise<unknown> {
  const conCuerpo = body !== undefined;
  const respuesta = await fetch(ruta, {
    method,
    headers: conCuerpo ? { "Content-Type": "application/json" } : undefined,
    body: conCuerpo ? JSON.stringify(body) : undefined,
  });
  await lanzarSiFalla(respuesta);
  if (respuesta.status === 204) return null;
  const datos: unknown = await respuesta.json();
  return datos;
}

/** Texto para mostrar al usuario: el de la API o uno genérico (red caída, etc.). */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) return error.message;
  return "No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.";
}
