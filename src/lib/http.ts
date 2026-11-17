import type { z } from "zod";
import { COOKIE_SESION, leerCookie } from "./cookies";
import { ErrorHttp, errorDeValidacion, prohibido } from "./errores";
import { revisarLimite } from "./limite-frecuencia";
import { registrarErrorInterno } from "./registro";

type Manejador<C> = (request: Request, contexto: C) => Promise<Response>;

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

function hostDe(origen: string): string | null {
  try {
    return new URL(origen).host;
  } catch {
    return null;
  }
}

/**
 * Defensa CSRF (además de SameSite=Lax) en peticiones que modifican datos:
 * - si llega `Origin`, debe ser este mismo sitio;
 * - si no llega pero hay cookie de sesión, se rechaza;
 * - sin Origin ni cookie (Bruno/Postman con Bearer) se permite.
 */
export function verificarOrigen(request: Request): void {
  if (METODOS_SEGUROS.has(request.method)) return;
  const origen = request.headers.get("origin");
  if (origen === null) {
    const cookie = leerCookie(request.headers.get("cookie"), COOKIE_SESION);
    if (cookie !== null) throw prohibido("Origen no permitido");
    return;
  }
  const host = request.headers.get("host") ?? new URL(request.url).host;
  if (hostDe(origen) !== host) throw prohibido("Origen no permitido");
}

function respuestaDeError(error: unknown): Response {
  if (error instanceof ErrorHttp) {
    const cuerpo =
      error.detalles.length > 0
        ? { error: error.message, detalles: error.detalles }
        : { error: error.message };
    const { status, cabeceras } = error;
    return Response.json(cuerpo, { status, headers: cabeceras });
  }
  const idPeticion = crypto.randomUUID();
  registrarErrorInterno(idPeticion, error);
  return Response.json(
    { error: "Error interno del servidor" },
    { status: 500, headers: { "X-Request-Id": idPeticion } },
  );
}

/**
 * Envoltorio común de los Route Handlers: limita la frecuencia (429), verifica
 * el Origin, convierte ErrorHttp en `{ error, detalles? }`, oculta los errores
 * internos (500) y marca las respuestas como privadas (`Cache-Control: no-store`).
 */
export function manejar<C>(handler: Manejador<C>): Manejador<C> {
  return async (request, contexto) => {
    let respuesta: Response;
    try {
      const excedido = revisarLimite(request);
      if (excedido) throw excedido;
      verificarOrigen(request);
      respuesta = await handler(request, contexto);
    } catch (error) {
      respuesta = respuestaDeError(error);
    }
    respuesta.headers.set("Cache-Control", "no-store");
    return respuesta;
  };
}

/**
 * Lee un cuerpo JSON sin validarlo (lo valida el servicio después de
 * revisar permisos): 415 si no es JSON, 400 si está mal formado.
 */
export async function leerCuerpoJson(request: Request): Promise<unknown> {
  const tipo = request.headers.get("content-type") ?? "";
  if (!tipo.includes("application/json")) {
    throw new ErrorHttp(415, "El cuerpo debe ser JSON");
  }
  try {
    const datos: unknown = await request.json();
    return datos;
  } catch {
    throw new ErrorHttp(400, "El cuerpo no es un JSON válido");
  }
}

/** Lee y valida un cuerpo JSON: 415 si no es JSON, 400 si es inválido. */
export async function leerJson<T extends z.ZodType>(
  request: Request,
  esquema: T,
): Promise<z.output<T>> {
  const datos = await leerCuerpoJson(request);
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  return resultado.data;
}
