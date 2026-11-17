import { errorDeValidacion, noEncontrado } from "@/lib/errores";
import * as repo from "@/repositories/tareas";
import { ConsultaTareasSchema } from "@/schemas/consulta-tareas";
import { ID_DOCUMENTO } from "@/schemas/lista";
import type { Proyecto } from "@/schemas/proyecto";
import type { Tarea } from "@/schemas/tarea";
import { detalleEstado, detalleTareaCreada, nuevaActividad } from "./actividad";
import { exigirPermiso } from "./permisos";
import { requerirMiembro } from "./proyectos";
import { aplicarCambiosTarea, prepararTareaNueva } from "./tareas";

/**
 * Casos de uso de tareas. Reciben el proyecto ya cargado (la ruta o la página
 * lo leen una vez con `cargarComoMiembro`): ruta → servicio → repositorio.
 */

const TAREA_NO_ENCONTRADA = "Tarea no encontrada";

function validarIdTarea(id: string): void {
  if (!ID_DOCUMENTO.test(id)) throw noEncontrado(TAREA_NO_ENCONTRADA);
}

/** Lista con filtros por estado y responsable; `mias=1` usa el uid de la sesión. */
export async function listarTareas(
  proyecto: Proyecto,
  actorUid: string,
  consulta: unknown,
): Promise<repo.PaginaTareas> {
  requerirMiembro(proyecto, actorUid, "lector");
  const resultado = ConsultaTareasSchema.safeParse(consulta);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  const { estado, responsable, mias, limite, cursor } = resultado.data;
  const responsableUid = mias ? actorUid : responsable;
  return repo.listarTareas(proyecto.id, {
    estado,
    responsableUid,
    limite,
    cursor,
  });
}

export async function obtenerTarea(
  proyecto: Proyecto,
  actorUid: string,
  id: string,
): Promise<Tarea> {
  requerirMiembro(proyecto, actorUid, "lector");
  validarIdTarea(id);
  const tarea = await repo.obtenerTarea(proyecto.id, id);
  if (!tarea) throw noEncontrado(TAREA_NO_ENCONTRADA);
  return tarea;
}

export async function crearTarea(
  proyecto: Proyecto,
  actorUid: string,
  entrada: unknown,
  ahora: Date = new Date(),
): Promise<Tarea> {
  const tarea = prepararTareaNueva({
    id: repo.nuevoIdTarea(proyecto.id),
    actorUid,
    miembros: proyecto.miembros,
    entrada,
    ahora,
  });
  const actividad = nuevaActividad(
    { proyectoId: proyecto.id, uid: actorUid, ahora },
    "tareaCreada",
    detalleTareaCreada(tarea.titulo),
  );
  await repo.guardarTareaNueva(proyecto.id, tarea, actividad);
  return tarea;
}

export async function actualizarTarea(
  proyecto: Proyecto,
  actorUid: string,
  id: string,
  cambios: unknown,
  ahora: Date = new Date(),
): Promise<Tarea> {
  exigirPermiso(proyecto.miembros, actorUid, "editar");
  validarIdTarea(id);
  const registrarCambioDeEstado = (antes: Tarea, despues: Tarea) =>
    antes.estado === despues.estado
      ? null
      : nuevaActividad(
          { proyectoId: proyecto.id, uid: actorUid, ahora },
          "estadoCambiado",
          detalleEstado(despues.titulo, antes.estado, despues.estado),
        );
  return repo.modificarTarea(
    proyecto.id,
    id,
    (actual) => {
      if (!actual) throw noEncontrado(TAREA_NO_ENCONTRADA);
      return aplicarCambiosTarea({
        actorUid,
        miembros: proyecto.miembros,
        tarea: actual,
        cambios,
      });
    },
    registrarCambioDeEstado,
  );
}

export async function eliminarTarea(
  proyecto: Proyecto,
  actorUid: string,
  id: string,
): Promise<void> {
  exigirPermiso(proyecto.miembros, actorUid, "eliminarTarea");
  validarIdTarea(id);
  if (!(await repo.obtenerTarea(proyecto.id, id))) {
    throw noEncontrado(TAREA_NO_ENCONTRADA);
  }
  await repo.eliminarTarea(proyecto.id, id);
}
