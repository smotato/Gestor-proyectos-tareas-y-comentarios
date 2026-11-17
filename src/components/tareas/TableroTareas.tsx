"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useCambioEstado } from "@/hooks/useCambioEstado";
import { ETIQUETA_ESTADO } from "@/lib/tareas-ui";
import { ESTADOS_TAREA, type EstadoTarea, type Tarea } from "@/schemas/tarea";
import { DialogoTarea } from "./DialogoTarea";
import { TarjetaTarea } from "./TarjetaTarea";
import type { OpcionMiembro, SolicitudDialogo } from "./tipos";

interface PropsTablero {
  proyectoId: string;
  tareas: Tarea[];
  miembros: readonly OpcionMiembro[];
  puedeCrear: boolean;
  puedeEditar: boolean;
  /** Hay filtros en la URL (cambia el mensaje de "sin tareas"). */
  hayFiltros: boolean;
  /** Ruta a la que se vuelve para quitar los filtros. */
  rutaSinFiltros: string;
}

interface PropsColumnas {
  proyectoId: string;
  tareas: Tarea[];
  nombres: ReadonlyMap<string, string>;
  puedeEditar: boolean;
  onEditar: (tarea: Tarea) => void;
  onCambiarEstado: (tarea: Tarea, estado: EstadoTarea) => void;
}

function Columnas({ proyectoId, tareas, nombres, ...acciones }: PropsColumnas) {
  return (
    <div className="tablero">
      {ESTADOS_TAREA.map((estado) => {
        const columna = tareas.filter((tarea) => tarea.estado === estado);
        return (
          <section
            key={estado}
            className="columna"
            aria-labelledby={`col-${estado}`}
          >
            <h3 id={`col-${estado}`}>
              {ETIQUETA_ESTADO[estado]} ({columna.length})
            </h3>
            {columna.length === 0 ? (
              <p className="texto-tenue">Sin tareas en este estado.</p>
            ) : (
              <ul className="lista-tareas">
                {columna.map((tarea) => (
                  <TarjetaTarea
                    key={tarea.id}
                    tarea={tarea}
                    responsable={
                      nombres.get(tarea.responsableUid ?? "") ?? null
                    }
                    rutaDetalle={`/proyectos/${proyectoId}/tareas/${tarea.id}`}
                    {...acciones}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function SinTareas({
  hayFiltros,
  ruta,
}: {
  hayFiltros: boolean;
  ruta: string;
}) {
  return hayFiltros ? (
    <p className="vacio">
      Ninguna tarea coincide con los filtros.{" "}
      <Link href={ruta}>Quitar filtros</Link>
    </p>
  ) : (
    <p className="vacio">Este proyecto todavía no tiene tareas.</p>
  );
}

/**
 * Tablero con una columna por estado (en el móvil se apilan como una lista).
 * Los botones de crear y editar solo existen según el rol; la API lo vuelve a verificar.
 */
export function TableroTareas(props: PropsTablero) {
  const { visibles, error, cambiarEstado } = useCambioEstado(
    props.proyectoId,
    props.tareas,
  );
  const [solicitud, setSolicitud] = useState<SolicitudDialogo | null>(null);
  const cerrar = useCallback(() => setSolicitud(null), []);
  const nombres = new Map(props.miembros.map((m) => [m.uid, m.nombre]));

  return (
    <div className="pila">
      {props.puedeCrear ? (
        <button
          type="button"
          className="boton"
          onClick={() => setSolicitud({ modo: "crear" })}
        >
          Nueva tarea
        </button>
      ) : null}
      <p role="alert" className="formulario__mensaje">
        {error}
      </p>
      {visibles.length === 0 ? (
        <SinTareas hayFiltros={props.hayFiltros} ruta={props.rutaSinFiltros} />
      ) : (
        <Columnas
          proyectoId={props.proyectoId}
          tareas={visibles}
          nombres={nombres}
          puedeEditar={props.puedeEditar}
          onEditar={(tarea) => setSolicitud({ modo: "editar", tarea })}
          onCambiarEstado={cambiarEstado}
        />
      )}
      {props.puedeCrear || props.puedeEditar ? (
        <DialogoTarea
          proyectoId={props.proyectoId}
          miembros={props.miembros}
          solicitud={solicitud}
          onCerrar={cerrar}
        />
      ) : null}
    </div>
  );
}
