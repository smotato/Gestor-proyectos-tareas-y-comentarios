import type { EstadoTarea, Prioridad } from "@/schemas/tarea";

export const ETIQUETA_ESTADO: Readonly<Record<EstadoTarea, string>> = {
  pendiente: "Pendiente",
  enProgreso: "En progreso",
  hecha: "Hecha",
};

export const ETIQUETA_PRIORIDAD: Readonly<Record<Prioridad, string>> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

/** `2026-12-01` → «1 dic 2026». Fija UTC para que servidor y navegador coincidan. */
export function formatearFecha(dia: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(dia));
}
