import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { formatearFechaHora } from "@/lib/tareas-ui";
import type { Comentario } from "@/schemas/comentario";

interface PropsLista {
  items: readonly Comentario[];
  /** Nombre (correo) de cada autor por uid. */
  nombres: ReadonlyMap<string, string>;
}

/** El texto se muestra como texto plano: React lo escapa, no se interpreta HTML. */
export function ListaComentarios({ items, nombres }: PropsLista) {
  if (items.length === 0) {
    return (
      <EstadoVacio mensaje="Todavía no hay comentarios en esta tarea. Los nuevos aparecerán aquí." />
    );
  }
  return (
    <ol className="comentarios">
      {items.map((comentario) => (
        <li key={comentario.id} className="comentario">
          <p className="comentario__cabecera">
            <strong>{nombres.get(comentario.uid) ?? "Un exmiembro"}</strong>{" "}
            <time dateTime={comentario.creadoEn} className="texto-tenue">
              {formatearFechaHora(comentario.creadoEn)}
            </time>
          </p>
          <p className="comentario__texto">{comentario.texto}</p>
        </li>
      ))}
    </ol>
  );
}
