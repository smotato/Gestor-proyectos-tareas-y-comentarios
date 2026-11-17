import { formatearFechaHora } from "@/lib/tareas-ui";
import type { Actividad } from "@/schemas/actividad";

interface PropsLista {
  items: readonly Actividad[];
  /** Nombre (correo) de cada miembro por uid. */
  nombres: ReadonlyMap<string, string>;
  /** Hay registros más antiguos que no se muestran. */
  hayMas: boolean;
}

/** Registro del proyecto, lo más reciente primero. */
export function ListaActividad({ items, nombres, hayMas }: PropsLista) {
  if (items.length === 0) {
    return <p className="vacio">Todavía no hay actividad en este proyecto.</p>;
  }
  return (
    <>
      <ol className="actividad">
        {items.map((registro) => (
          <li key={registro.id} className="actividad__item">
            <p>
              <strong>{nombres.get(registro.uid) ?? "Un exmiembro"}</strong>
              {" · "}
              {registro.detalle}
            </p>
            <time dateTime={registro.creadoEn} className="texto-tenue">
              {formatearFechaHora(registro.creadoEn)}
            </time>
          </li>
        ))}
      </ol>
      {hayMas ? (
        <p className="texto-tenue">
          Se muestran los {items.length} registros más recientes.
        </p>
      ) : null}
    </>
  );
}
