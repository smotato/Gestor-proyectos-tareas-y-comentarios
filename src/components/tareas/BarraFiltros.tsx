import Link from "next/link";
import { urlConFiltros } from "@/lib/filtros-tareas";
import { ETIQUETA_ESTADO } from "@/lib/tareas-ui";
import type { FiltrosTareas } from "@/schemas/consulta-tareas";
import { ESTADOS_TAREA } from "@/schemas/tarea";
import type { OpcionMiembro } from "./tipos";

interface PropsBarra {
  /** Ruta del proyecto, por ejemplo `/proyectos/abc`. */
  base: string;
  filtros: FiltrosTareas;
  miembros: readonly OpcionMiembro[];
}

/** «Todas las tareas» o «Mis tareas» (`?mias=1`); marca la vista actual. */
function PestanasVista({ base, mias }: { base: string; mias: boolean }) {
  return (
    <nav aria-label="Vista de tareas">
      <ul className="pestanas">
        <li>
          <Link href={base} aria-current={mias ? undefined : "page"}>
            Todas las tareas
          </Link>
        </li>
        <li>
          <Link
            href={urlConFiltros(base, { mias: "1" })}
            aria-current={mias ? "page" : undefined}
          >
            Mis tareas
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function FiltroEstado({ valor }: { valor: FiltrosTareas["estado"] }) {
  return (
    <div className="campo">
      <label htmlFor="filtro-estado">Estado</label>
      <select id="filtro-estado" name="estado" defaultValue={valor ?? ""}>
        <option value="">Todos los estados</option>
        {ESTADOS_TAREA.map((estado) => (
          <option key={estado} value={estado}>
            {ETIQUETA_ESTADO[estado]}
          </option>
        ))}
      </select>
    </div>
  );
}

interface PropsResponsable {
  valor: FiltrosTareas["responsable"];
  miembros: readonly OpcionMiembro[];
}

function FiltroResponsable({ valor, miembros }: PropsResponsable) {
  return (
    <div className="campo">
      <label htmlFor="filtro-responsable">Responsable</label>
      <select
        id="filtro-responsable"
        name="responsable"
        defaultValue={valor ?? ""}
      >
        <option value="">Todos</option>
        {miembros.map((miembro) => (
          <option key={miembro.uid} value={miembro.uid}>
            {miembro.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Filtros por estado y responsable en la URL. Es un formulario GET normal:
 * funciona sin JavaScript y la URL se puede compartir o guardar.
 */
export function BarraFiltros({ base, filtros, miembros }: PropsBarra) {
  const mias = filtros.mias === "1";
  return (
    <div className="filtros">
      <PestanasVista base={base} mias={mias} />
      <form method="get" action={base} className="filtros__form">
        <FiltroEstado valor={filtros.estado} />
        {mias ? (
          <input type="hidden" name="mias" value="1" />
        ) : (
          <FiltroResponsable valor={filtros.responsable} miembros={miembros} />
        )}
        <button type="submit" className="boton boton--secundario">
          Aplicar filtros
        </button>
      </form>
    </div>
  );
}
