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

/** `2026-11-16T15:30:00Z` → «16 nov 2026, 15:30 UTC» (UTC: servidor y navegador coinciden). */
export function formatearFechaHora(iso: string): string {
  const texto = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
  return `${texto} UTC`;
}

/** `2026-12-01` → «1 dic 2026». Fija UTC para que servidor y navegador coincidan. */
export function formatearFecha(dia: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(dia));
}
