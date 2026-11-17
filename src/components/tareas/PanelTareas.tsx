import { leerFiltros, urlConFiltros } from "@/lib/filtros-tareas";
import {
  miembrosDelProyecto,
  proyectoDelUsuario,
} from "@/lib/proyectos-servidor";
import { listarTareas } from "@/services/gestion-tareas";
import { puede } from "@/services/permisos";
import { BarraFiltros } from "./BarraFiltros";
import { TableroTareas } from "./TableroTareas";

/** El tablero muestra hasta 100 tareas (el máximo de la API); no hay paginación en pantalla. */
const LIMITE_TABLERO = 100;

interface PropsPanel {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Server Component: verifica la sesión y la membresía (404 si no es miembro),
 * lee las tareas filtradas por la URL y decide qué botones ve cada rol.
 * Va dentro de un <Suspense> porque lee la cookie y los parámetros de la petición.
 */
export async function PanelTareas({ params, searchParams }: PropsPanel) {
  const { id } = await params;
  const filtros = leerFiltros(await searchParams);
  const { usuario, proyecto, rol } = await proyectoDelUsuario(id);
  const [pagina, vistas] = await Promise.all([
    listarTareas(proyecto, usuario.uid, { ...filtros, limite: LIMITE_TABLERO }),
    miembrosDelProyecto(id),
  ]);
  const miembros = vistas.map((m) => ({
    uid: m.uid,
    nombre: m.correo ?? m.uid,
  }));
  const base = `/proyectos/${id}`;
  const sinFiltros = filtros.mias ? urlConFiltros(base, { mias: "1" }) : base;
  return (
    <div className="pila">
      <BarraFiltros base={base} filtros={filtros} miembros={miembros} />
      <TableroTareas
        proyectoId={id}
        tareas={pagina.items}
        miembros={miembros}
        puedeCrear={puede(rol, "crear")}
        puedeEditar={puede(rol, "editar")}
        hayFiltros={Object.keys(filtros).length > 0}
        rutaSinFiltros={sinFiltros}
      />
    </div>
  );
}
