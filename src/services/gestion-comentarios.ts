import { errorDeValidacion } from "@/lib/errores";
import * as repo from "@/repositories/comentarios";
import type { Pagina } from "@/repositories/utilidades";
import type { Comentario } from "@/schemas/comentario";
import { ConsultaListaSchema } from "@/schemas/lista";
import type { Proyecto } from "@/schemas/proyecto";
import { detalleComentario, nuevaActividad } from "./actividad";
import { prepararComentarioNuevo } from "./comentarios";
import { obtenerTarea } from "./gestion-tareas";
import { exigirPermiso } from "./permisos";

/** Los comentarios más antiguos primero; 404 si la tarea no existe. */
export async function listarComentarios(
  proyecto: Proyecto,
  actorUid: string,
  tareaId: string,
  consulta: unknown,
): Promise<Pagina<Comentario>> {
  await obtenerTarea(proyecto, actorUid, tareaId);
  const resultado = ConsultaListaSchema.safeParse(consulta);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  const { limite, cursor } = resultado.data;
  return repo.listarComentarios(proyecto.id, tareaId, limite, cursor);
}

/**
 * Comentar cuenta como "crear": un lector recibe 403. El autor y la fecha
 * salen de la sesión y del servidor, y el comentario queda en la actividad.
 */
export async function crearComentario(
  proyecto: Proyecto,
  actorUid: string,
  tareaId: string,
  entrada: unknown,
  ahora: Date = new Date(),
): Promise<Comentario> {
  exigirPermiso(proyecto.miembros, actorUid, "crear");
  const tarea = await obtenerTarea(proyecto, actorUid, tareaId);
  const comentario = prepararComentarioNuevo({
    id: repo.nuevoIdComentario(proyecto.id, tareaId),
    actorUid,
    miembros: proyecto.miembros,
    entrada,
    ahora,
  });
  const origen = { proyectoId: proyecto.id, uid: actorUid, ahora };
  const actividad = nuevaActividad(
    origen,
    "comentarioCreado",
    detalleComentario(tarea.titulo),
  );
  await repo.guardarComentarioNuevo(
    proyecto.id,
    tareaId,
    comentario,
    actividad,
  );
  return comentario;
}
