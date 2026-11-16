import {
  conflicto,
  errorDeValidacion,
  noEncontrado,
  prohibido,
} from "@/lib/errores";
import * as repo from "@/repositories/proyectos";
import { correosPorUid } from "@/repositories/usuarios";
import { ConsultaListaSchema, ID_DOCUMENTO } from "@/schemas/lista";
import { CambiarRolSchema, type Miembros } from "@/schemas/miembro";
import { CrearProyectoSchema, type Proyecto } from "@/schemas/proyecto";
import type { Rol } from "@/schemas/rol";
import { puedeCambiarRolDe, puedeQuitarMiembro } from "./permisos";

const RANGO: Readonly<Record<Rol, number>> = {
  lector: 1,
  editor: 2,
  propietario: 3,
};

const PROYECTO_NO_ENCONTRADO = "Proyecto no encontrado";
const ULTIMO_PROPIETARIO = "El proyecto debe conservar al menos un propietario";

export interface ResumenProyecto {
  id: string;
  nombre: string;
  creadoEn: string;
  rol: Rol;
  totalMiembros: number;
}

export interface MiembroVista {
  uid: string;
  rol: Rol;
  correo: string | null;
}

/**
 * Regla de acceso de toda ruta `/api/proyectos/:id/**`.
 * 404 si el proyecto no existe o el usuario no es miembro (no se revela);
 * 403 si es miembro pero su rol no alcanza `rolMinimo`.
 */
export function requerirMiembro(
  proyecto: Proyecto | null,
  uid: string,
  rolMinimo: Rol,
): Rol {
  const miembros = proyecto?.miembros ?? {};
  const rol = Object.hasOwn(miembros, uid) ? miembros[uid] : undefined;
  if (rol === undefined) throw noEncontrado(PROYECTO_NO_ENCONTRADO);
  if (RANGO[rol] < RANGO[rolMinimo]) throw prohibido();
  return rol;
}

/** Carga el proyecto y aplica `requerirMiembro`. */
export async function cargarComoMiembro(
  proyectoId: string,
  uid: string,
  rolMinimo: Rol,
): Promise<{ proyecto: Proyecto; rol: Rol }> {
  const proyecto = ID_DOCUMENTO.test(proyectoId)
    ? await repo.obtenerProyecto(proyectoId)
    : null;
  const rol = requerirMiembro(proyecto, uid, rolMinimo);
  if (!proyecto) throw noEncontrado(PROYECTO_NO_ENCONTRADO);
  return { proyecto, rol };
}

function resumen(proyecto: Proyecto, uid: string): ResumenProyecto {
  return {
    id: proyecto.id,
    nombre: proyecto.nombre,
    creadoEn: proyecto.creadoEn,
    rol: proyecto.miembros[uid] ?? "lector",
    totalMiembros: proyecto.miembrosUids.length,
  };
}

export async function listarMisProyectos(uid: string, consulta: unknown) {
  const resultado = ConsultaListaSchema.safeParse(consulta);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  const { limite, cursor } = resultado.data;
  const pagina = await repo.listarProyectosDeMiembro(uid, limite, cursor);
  return {
    items: pagina.items.map((proyecto) => resumen(proyecto, uid)),
    siguienteCursor: pagina.siguienteCursor,
  };
}

/** Quien crea el proyecto queda como su único propietario. */
export async function crearProyecto(
  uid: string,
  entrada: unknown,
  ahora: Date = new Date(),
): Promise<Proyecto> {
  const resultado = CrearProyectoSchema.safeParse(entrada);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  const proyecto: Proyecto = {
    id: repo.nuevoIdProyecto(),
    nombre: resultado.data.nombre,
    propietarioUid: uid,
    miembros: { [uid]: "propietario" },
    miembrosUids: [uid],
    creadoEn: ahora.toISOString(),
  };
  await repo.guardarProyectoNuevo(proyecto);
  return proyecto;
}

/** Miembros con su correo, propietarios primero. */
export async function miembrosConCorreo(
  proyecto: Proyecto,
): Promise<MiembroVista[]> {
  const correos = await correosPorUid(proyecto.miembrosUids);
  return proyecto.miembrosUids
    .map((uid) => ({
      uid,
      rol: proyecto.miembros[uid] ?? "lector",
      correo: correos.get(uid) ?? null,
    }))
    .sort((a, b) => RANGO[b.rol] - RANGO[a.rol]);
}

export async function listarMiembros(proyectoId: string, uid: string) {
  const { proyecto, rol } = await cargarComoMiembro(proyectoId, uid, "lector");
  return { rol, items: await miembrosConCorreo(proyecto) };
}

/** Recalcula `miembrosUids` y mantiene `propietarioUid` apuntando a un propietario. */
function conMiembros(proyecto: Proyecto, miembros: Miembros): Proyecto {
  const miembrosUids = Object.keys(miembros);
  const sigue = miembros[proyecto.propietarioUid] === "propietario";
  const otro = miembrosUids.find((uid) => miembros[uid] === "propietario");
  return {
    ...proyecto,
    miembros,
    miembrosUids,
    propietarioUid: sigue ? proyecto.propietarioUid : (otro ?? ""),
  };
}

/** Dentro de la transacción: vuelve a comprobar actor y objetivo. */
function validarEnTransaccion(
  proyecto: Proyecto | null,
  actorUid: string,
  objetivoUid: string,
): Proyecto {
  requerirMiembro(proyecto, actorUid, "propietario");
  if (!proyecto) throw noEncontrado(PROYECTO_NO_ENCONTRADO);
  if (!Object.hasOwn(proyecto.miembros, objetivoUid)) {
    throw noEncontrado("Miembro no encontrado");
  }
  return proyecto;
}

export async function cambiarRolMiembro(
  actorUid: string,
  proyectoId: string,
  objetivoUid: string,
  entrada: unknown,
): Promise<Proyecto> {
  await cargarComoMiembro(proyectoId, actorUid, "propietario");
  const resultado = CambiarRolSchema.safeParse(entrada);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  const nuevoRol = resultado.data.rol;
  return repo.modificarMembresia(proyectoId, (actual) => {
    const proyecto = validarEnTransaccion(actual, actorUid, objetivoUid);
    if (!puedeCambiarRolDe(proyecto.miembros, objetivoUid, nuevoRol)) {
      throw conflicto(ULTIMO_PROPIETARIO);
    }
    return conMiembros(proyecto, {
      ...proyecto.miembros,
      [objetivoUid]: nuevoRol,
    });
  });
}

export async function quitarMiembro(
  actorUid: string,
  proyectoId: string,
  objetivoUid: string,
): Promise<void> {
  await cargarComoMiembro(proyectoId, actorUid, "propietario");
  await repo.modificarMembresia(proyectoId, (actual) => {
    const proyecto = validarEnTransaccion(actual, actorUid, objetivoUid);
    if (!puedeQuitarMiembro(proyecto.miembros, objetivoUid)) {
      throw conflicto(ULTIMO_PROPIETARIO);
    }
    const resto = Object.fromEntries(
      Object.entries(proyecto.miembros).filter(([uid]) => uid !== objetivoUid),
    );
    return conMiembros(proyecto, resto);
  });
}
