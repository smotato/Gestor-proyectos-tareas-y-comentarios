import type { Miembros } from "@/schemas/miembro";
import type { Rol } from "@/schemas/rol";

export const ACCIONES = [
  "ver",
  "crear",
  "editar",
  "eliminarTarea",
  "eliminarProyecto",
  "invitar",
  "cambiarRol",
] as const;

export type Accion = (typeof ACCIONES)[number];

/** Tabla de permisos por rol. `eliminarTarea` cubre tareas y comentarios. */
export const PERMISOS: Readonly<Record<Rol, ReadonlySet<Accion>>> = {
  propietario: new Set<Accion>(ACCIONES),
  editor: new Set<Accion>(["ver", "crear", "editar", "eliminarTarea"]),
  lector: new Set<Accion>(["ver"]),
};

export function puede(rol: Rol, accion: Accion): boolean {
  return PERMISOS[rol].has(accion);
}

type MapaMiembros = Readonly<Miembros>;

export function esUltimoPropietario(
  miembros: MapaMiembros,
  uid: string,
): boolean {
  if (miembros[uid] !== "propietario") return false;
  const propietarios = Object.values(miembros).filter(
    (rol) => rol === "propietario",
  );
  return propietarios.length === 1;
}

/** No se puede quitar a quien no es miembro ni al último propietario. */
export function puedeQuitarMiembro(
  miembros: MapaMiembros,
  uid: string,
): boolean {
  return Object.hasOwn(miembros, uid) && !esUltimoPropietario(miembros, uid);
}

/** No se puede degradar al último propietario (dejaría el proyecto sin dueño). */
export function puedeCambiarRolDe(
  miembros: MapaMiembros,
  uid: string,
  nuevoRol: Rol,
): boolean {
  if (!Object.hasOwn(miembros, uid)) return false;
  return nuevoRol === "propietario" || !esUltimoPropietario(miembros, uid);
}
