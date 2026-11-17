import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { obtenerTarea } from "@/services/gestion-tareas";
import { cargarComoMiembro, miembrosConCorreo } from "@/services/proyectos";
import type { Usuario } from "./auth";
import { usuarioActual } from "./auth-servidor";
import { ErrorHttp } from "./errores";

/**
 * Lecturas para Server Components. `cache` evita repetirlas en una misma
 * petición (el layout del proyecto y su página piden lo mismo).
 * Quien las llame debe estar dentro de un <Suspense>.
 */

export const sesionRequerida = cache(async (): Promise<Usuario> => {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
});

/** El proyecto y el rol del usuario; 404 de Next si no es miembro. */
export const proyectoDelUsuario = cache(async (id: string) => {
  const usuario = await sesionRequerida();
  try {
    return { usuario, ...(await cargarComoMiembro(id, usuario.uid, "lector")) };
  } catch (error) {
    if (error instanceof ErrorHttp && error.status === 404) notFound();
    throw error;
  }
});

/** Miembros con su correo; se piden una sola vez por petición. */
export const miembrosDelProyecto = cache(async (id: string) => {
  const { proyecto } = await proyectoDelUsuario(id);
  return miembrosConCorreo(proyecto);
});

/** Como `proyectoDelUsuario`, más la tarea; 404 de Next si no existe. */
export const tareaDelProyecto = cache(async (id: string, tareaId: string) => {
  const contexto = await proyectoDelUsuario(id);
  const { proyecto, usuario } = contexto;
  try {
    const tarea = await obtenerTarea(proyecto, usuario.uid, tareaId);
    return { ...contexto, tarea };
  } catch (error) {
    if (error instanceof ErrorHttp && error.status === 404) notFound();
    throw error;
  }
});
