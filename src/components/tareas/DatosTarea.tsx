import { hoyUtc } from "@/lib/tareas-ui";
import type { Tarea } from "@/schemas/tarea";
import { InsigniaEstado, InsigniaPrioridad } from "./InsigniasTarea";
import { FechaVence, InsigniaVencida } from "./VencimientoTarea";

interface PropsDatos {
  tarea: Tarea;
  /** Nombre del responsable (`null` si no tiene). */
  responsable: string | null;
  /** Hoy en UTC (`AAAA-MM-DD`); si falta se calcula al pintar. */
  hoy?: string;
}

export function DatosTarea({ tarea, responsable, hoy = hoyUtc() }: PropsDatos) {
  return (
    <dl className="tarea__datos tarea__datos--ancho">
      <dt>Estado</dt>
      <dd>
        <InsigniaEstado estado={tarea.estado} />
      </dd>
      <dt>Prioridad</dt>
      <dd>
        <InsigniaPrioridad prioridad={tarea.prioridad} />
      </dd>
      <dt>Responsable</dt>
      <dd>{responsable ?? "Sin responsable"}</dd>
      <dt>Vence</dt>
      <dd>
        <FechaVence vence={tarea.vence} />{" "}
        <InsigniaVencida tarea={tarea} hoy={hoy} />
      </dd>
    </dl>
  );
}
