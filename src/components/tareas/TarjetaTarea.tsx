"use client";

import {
  ETIQUETA_ESTADO,
  ETIQUETA_PRIORIDAD,
  formatearFecha,
} from "@/lib/tareas-ui";
import {
  ESTADOS_TAREA,
  EstadoTareaSchema,
  type EstadoTarea,
  type Tarea,
} from "@/schemas/tarea";

interface PropsTarjeta {
  tarea: Tarea;
  /** Nombre del responsable (`null` si no tiene). */
  responsable: string | null;
  puedeEditar: boolean;
  onEditar: (tarea: Tarea) => void;
  onCambiarEstado: (tarea: Tarea, estado: EstadoTarea) => void;
}

function SelectorEstado(props: PropsTarjeta) {
  const { tarea } = props;
  return (
    <div className="tarea__estado">
      <label id={`estado-${tarea.id}-et`} htmlFor={`estado-${tarea.id}`}>
        Estado
      </label>
      <select
        id={`estado-${tarea.id}`}
        aria-labelledby={`estado-${tarea.id}-et titulo-${tarea.id}`}
        value={tarea.estado}
        onChange={(e) =>
          props.onCambiarEstado(tarea, EstadoTareaSchema.parse(e.target.value))
        }
      >
        {ESTADOS_TAREA.map((estado) => (
          <option key={estado} value={estado}>
            {ETIQUETA_ESTADO[estado]}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Una tarea del tablero. Solo quien puede editar ve el selector de estado y "Editar". */
export function TarjetaTarea(props: PropsTarjeta) {
  const { tarea, responsable, puedeEditar } = props;
  return (
    <li className="tarea">
      <h4 id={`titulo-${tarea.id}`} className="tarea__titulo">
        {tarea.titulo}
      </h4>
      <dl className="tarea__datos">
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
      {puedeEditar ? (
        <>
          <SelectorEstado {...props} />
          <button
            type="button"
            className="boton boton--secundario"
            aria-label={`Editar tarea ${tarea.titulo}`}
            onClick={() => props.onEditar(tarea)}
          >
            Editar
          </button>
        </>
      ) : null}
    </li>
  );
}
