import { errorDeValidacion } from "@/lib/errores";
import * as repo from "@/repositories/actividad";
import type { Pagina } from "@/repositories/utilidades";
import type { Actividad } from "@/schemas/actividad";
import { ConsultaListaSchema } from "@/schemas/lista";
import type { Proyecto } from "@/schemas/proyecto";
import { requerirMiembro } from "./proyectos";

/** Registro del proyecto, lo más reciente primero. Cualquier miembro lo ve. */
export async function listarActividad(
  proyecto: Proyecto,
  actorUid: string,
  consulta: unknown,
): Promise<Pagina<Actividad>> {
  requerirMiembro(proyecto, actorUid, "lector");
  const resultado = ConsultaListaSchema.safeParse(consulta);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  const { limite, cursor } = resultado.data;
  return repo.listarActividad(proyecto.id, limite, cursor);
}
