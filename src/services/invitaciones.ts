import { randomBytes } from "node:crypto";
import {
  conflicto,
  errorDeValidacion,
  noEncontrado,
  vencido,
} from "@/lib/errores";
import * as repo from "@/repositories/invitaciones";
import { obtenerProyecto } from "@/repositories/proyectos";
import { CrearInvitacionSchema, type Invitacion } from "@/schemas/invitacion";
import { ID_DOCUMENTO } from "@/schemas/lista";
import type { Proyecto } from "@/schemas/proyecto";
import type { Rol } from "@/schemas/rol";
import { exigirPermiso } from "./permisos";

/** Una invitación sirve durante 7 días. */
export const DURACION_INVITACION_MS = 7 * 24 * 60 * 60 * 1000;

const NO_ENCONTRADA = "Invitación no encontrada";
const PROYECTO_BORRADO = "El proyecto de esta invitación ya no existe";

/** 128 bits aleatorios en base64url (22 caracteres): no se puede adivinar. */
export function nuevoCodigo(): string {
  return randomBytes(16).toString("base64url");
}

/** Solo el propietario invita (acción `invitar`); el rol, el código y la fecha los pone el servidor. */
export async function crearInvitacion(
  proyecto: Proyecto,
  actorUid: string,
  entrada: unknown,
  ahora: Date = new Date(),
): Promise<Invitacion> {
  exigirPermiso(proyecto.miembros, actorUid, "invitar");
  const resultado = CrearInvitacionSchema.safeParse(entrada);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  const invitacion: Invitacion = {
    codigo: nuevoCodigo(),
    proyectoId: proyecto.id,
    rol: resultado.data.rol,
    expira: new Date(ahora.getTime() + DURACION_INVITACION_MS).toISOString(),
    usada: false,
  };
  await repo.guardarInvitacionNueva(invitacion);
  return invitacion;
}

function estaVencida(invitacion: Invitacion, ahora: Date): boolean {
  return Date.parse(invitacion.expira) <= ahora.getTime();
}

/**
 * Reglas de aceptación; corren dentro de la transacción.
 * Una invitación ya usada da 409 (aunque además haya vencido), una vencida 410
 * y quien ya es miembro 409 sin gastar la invitación.
 */
export function aplicarInvitacion(
  invitacion: Invitacion | null,
  proyecto: Proyecto | null,
  uid: string,
  ahora: Date,
): Proyecto {
  if (!invitacion) throw noEncontrado(NO_ENCONTRADA);
  if (invitacion.usada) throw conflicto("Esta invitación ya fue usada");
  if (estaVencida(invitacion, ahora)) throw vencido("Esta invitación venció");
  if (!proyecto) throw noEncontrado(PROYECTO_BORRADO);
  if (Object.hasOwn(proyecto.miembros, uid)) {
    throw conflicto("Ya eres miembro de este proyecto");
  }
  const miembros = { ...proyecto.miembros, [uid]: invitacion.rol };
  return { ...proyecto, miembros, miembrosUids: Object.keys(miembros) };
}

/** El uid sale de la sesión, nunca del cuerpo. Devuelve el proyecto al que se unió. */
export async function aceptarInvitacion(
  uid: string,
  codigo: string,
  ahora: Date = new Date(),
): Promise<{ proyectoId: string; rol: Rol }> {
  if (!ID_DOCUMENTO.test(codigo)) throw noEncontrado(NO_ENCONTRADA);
  const proyecto = await repo.aceptarInvitacion(codigo, (invitacion, actual) =>
    aplicarInvitacion(invitacion, actual, uid, ahora),
  );
  return { proyectoId: proyecto.id, rol: proyecto.miembros[uid] ?? "lector" };
}

export type EstadoInvitacion = "valida" | "usada" | "vencida" | "miembro";

export interface VistaInvitacion {
  proyectoId: string;
  nombreProyecto: string;
  rol: Rol;
  estado: EstadoInvitacion;
}

function estadoDe(
  invitacion: Invitacion,
  proyecto: Proyecto,
  uid: string,
  ahora: Date,
): EstadoInvitacion {
  if (Object.hasOwn(proyecto.miembros, uid)) return "miembro";
  if (invitacion.usada) return "usada";
  return estaVencida(invitacion, ahora) ? "vencida" : "valida";
}

/** Lo que muestra la página `/invitacion/[codigo]` antes de aceptar. 404 si el código no existe. */
export async function describirInvitacion(
  uid: string,
  codigo: string,
  ahora: Date = new Date(),
): Promise<VistaInvitacion> {
  const invitacion = ID_DOCUMENTO.test(codigo)
    ? await repo.obtenerInvitacion(codigo)
    : null;
  if (!invitacion) throw noEncontrado(NO_ENCONTRADA);
  const proyecto = await obtenerProyecto(invitacion.proyectoId);
  if (!proyecto) throw noEncontrado(PROYECTO_BORRADO);
  return {
    proyectoId: proyecto.id,
    nombreProyecto: proyecto.nombre,
    rol: invitacion.rol,
    estado: estadoDe(invitacion, proyecto, uid, ahora),
  };
}
