import type { z } from "zod";

export interface DetalleError {
  campo: string;
  mensaje: string;
}

/** Error con código HTTP que la capa de rutas convertirá en `{ error, detalles? }`. */
export class ErrorHttp extends Error {
  readonly status: number;
  readonly detalles: readonly DetalleError[];

  constructor(
    status: number,
    mensaje: string,
    detalles: readonly DetalleError[] = [],
  ) {
    super(mensaje);
    this.name = "ErrorHttp";
    this.status = status;
    this.detalles = detalles;
  }
}

const MENSAJE_VALIDACION = "Datos inválidos";

export function noAutenticado(mensaje = "Inicia sesión para continuar") {
  return new ErrorHttp(401, mensaje);
}

export function prohibido(mensaje = "No tienes permiso para esta acción") {
  return new ErrorHttp(403, mensaje);
}

export function noEncontrado(mensaje = "No encontrado") {
  return new ErrorHttp(404, mensaje);
}

export function errorDeCampo(campo: string, mensaje: string): ErrorHttp {
  return new ErrorHttp(400, MENSAJE_VALIDACION, [{ campo, mensaje }]);
}

type IssueZod = z.ZodError["issues"][number];

function campoDe(issue: IssueZod): string {
  if (issue.path.length > 0) return issue.path.map(String).join(".");
  return issue.code === "unrecognized_keys" ? issue.keys.join(",") : "";
}

export function errorDeValidacion(error: z.ZodError): ErrorHttp {
  const detalles = error.issues.map((issue) => ({
    campo: campoDe(issue),
    mensaje: issue.message,
  }));
  return new ErrorHttp(400, MENSAJE_VALIDACION, detalles);
}
