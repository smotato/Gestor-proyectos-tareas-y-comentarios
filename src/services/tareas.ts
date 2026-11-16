import { errorDeCampo, errorDeValidacion } from "@/lib/errores";
import type { Miembros } from "@/schemas/miembro";
import {
  ActualizarTareaSchema,
  CrearTareaSchema,
  TareaSchema,
  type Tarea,
} from "@/schemas/tarea";
import { exigirPermiso } from "./permisos";

interface Contexto {
  actorUid: string;
  miembros: Readonly<Miembros>;
}

function validarResponsable(
  miembros: Readonly<Miembros>,
  responsableUid: string | null | undefined,
): void {
  if (responsableUid && !Object.hasOwn(miembros, responsableUid)) {
    throw errorDeCampo(
      "responsableUid",
      "El responsable debe ser miembro del proyecto",
    );
  }
}

/**
 * Valida y arma una tarea nueva. El permiso se revisa antes que los datos,
 * así un lector recibe 403 aunque el cuerpo sea inválido.
 */
export function prepararTareaNueva(
  datos: Contexto & { id: string; entrada: unknown; ahora: Date },
): Tarea {
  const { actorUid, miembros } = datos;
  exigirPermiso(miembros, actorUid, "crear");
  const resultado = CrearTareaSchema.safeParse(datos.entrada);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  validarResponsable(miembros, resultado.data.responsableUid);
  return {
    id: datos.id,
    ...resultado.data,
    estado: "pendiente",
    creadaPor: actorUid,
    creadaEn: datos.ahora.toISOString(),
  };
}

/** Valida los cambios de una tarea y devuelve la tarea actualizada. */
export function aplicarCambiosTarea(
  datos: Contexto & { tarea: Tarea; cambios: unknown },
): Tarea {
  const { actorUid, miembros } = datos;
  exigirPermiso(miembros, actorUid, "editar");
  const resultado = ActualizarTareaSchema.safeParse(datos.cambios);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  validarResponsable(miembros, resultado.data.responsableUid);
  return TareaSchema.parse({ ...datos.tarea, ...resultado.data });
}
