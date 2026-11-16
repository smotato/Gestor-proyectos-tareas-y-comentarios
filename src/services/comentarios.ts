import { errorDeValidacion } from "@/lib/errores";
import { type Comentario, CrearComentarioSchema } from "@/schemas/comentario";
import type { Miembros } from "@/schemas/miembro";
import { exigirPermiso } from "./permisos";

interface DatosComentarioNuevo {
  id: string;
  actorUid: string;
  miembros: Readonly<Miembros>;
  entrada: unknown;
  ahora: Date;
}

/**
 * Valida y arma un comentario nuevo. Comentar cuenta como "crear",
 * así que un lector no puede. El permiso se revisa antes que los datos.
 */
export function prepararComentarioNuevo(
  datos: DatosComentarioNuevo,
): Comentario {
  exigirPermiso(datos.miembros, datos.actorUid, "crear");
  const resultado = CrearComentarioSchema.safeParse(datos.entrada);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  return {
    id: datos.id,
    uid: datos.actorUid,
    texto: resultado.data.texto,
    creadoEn: datos.ahora.toISOString(),
  };
}

/** Eliminar comentarios usa el permiso `eliminarTarea` (propietario y editor). */
export function exigirPermisoEliminarComentario(
  miembros: Readonly<Miembros>,
  actorUid: string,
): void {
  exigirPermiso(miembros, actorUid, "eliminarTarea");
}
