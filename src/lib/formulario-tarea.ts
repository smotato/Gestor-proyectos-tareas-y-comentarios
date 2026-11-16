import type { z } from "zod";

function texto(datos: FormData, campo: string): string {
  const valor = datos.get(campo);
  return typeof valor === "string" ? valor : "";
}

/**
 * Convierte el formulario en el objeto que validan los esquemas Zod
 * (los mismos de la API): un campo vacío es `null` donde el esquema lo admite.
 */
export function datosDelFormulario(
  datos: FormData,
  editando: boolean,
): Record<string, unknown> {
  const base = {
    titulo: texto(datos, "titulo"),
    descripcion: texto(datos, "descripcion"),
    prioridad: texto(datos, "prioridad"),
    responsableUid: texto(datos, "responsableUid") || null,
    vence: texto(datos, "vence") || null,
  };
  return editando ? { ...base, estado: texto(datos, "estado") } : base;
}

/** Primer mensaje de error de cada campo. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "");
    errores[campo] ??= issue.message;
  }
  return errores;
}
