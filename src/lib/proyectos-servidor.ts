import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { cargarComoMiembro } from "@/services/proyectos";
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
