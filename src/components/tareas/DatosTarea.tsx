import {
  ETIQUETA_ESTADO,
  ETIQUETA_PRIORIDAD,
  formatearFecha,
} from "@/lib/tareas-ui";
import type { Tarea } from "@/schemas/tarea";

interface PropsDatos {
  tarea: Tarea;
  /** Nombre del responsable (`null` si no tiene). */
  responsable: string | null;
}

export function DatosTarea({ tarea, responsable }: PropsDatos) {
  return (
    <dl className="tarea__datos">
      <dt>Estado</dt>
      <dd>{ETIQUETA_ESTADO[tarea.estado]}</dd>
      <dt>Prioridad</dt>
      <dd>{ETIQUETA_PRIORIDAD[tarea.prioridad]}</dd>
      <dt>Responsable</dt>
      <dd>{responsable ?? "Sin responsable"}</dd>
      <dt>Vence</dt>
      <dd>
        {tarea.vence ? (
          <time dateTime={tarea.vence}>{formatearFecha(tarea.vence)}</time>
        ) : (
          "Sin fecha"
        )}
      </dd>
    </dl>
  );
}
