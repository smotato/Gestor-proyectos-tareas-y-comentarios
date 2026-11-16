import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type { Credenciales } from "@/schemas/sesion";
import { authCliente } from "./firebase/cliente";

/** Funciones del navegador: Firebase Auth + la API propia. */

export type ModoAcceso = "login" | "registro";

const RUTA_SESION = "/api/auth/sesion";

async function lanzarSiFalla(respuesta: Response): Promise<void> {
  if (respuesta.ok) return;
  let mensaje = `Error ${respuesta.status}`;
  try {
    const cuerpo: unknown = await respuesta.json();
    const texto: unknown =
      typeof cuerpo === "object" && cuerpo !== null
        ? Reflect.get(cuerpo, "error")
        : undefined;
    if (typeof texto === "string") mensaje = texto;
  } catch {
    // Cuerpo vacío o no JSON: se queda el mensaje con el código.
  }
  throw Object.assign(new Error(mensaje), { name: "ErrorApi" });
}

/** Inicia sesión (o registra) en Firebase y la cambia por la cookie del servidor. */
export async function iniciarSesion(
  modo: ModoAcceso,
  { correo, contrasena }: Credenciales,
): Promise<void> {
  const auth = authCliente();
  const credencial =
    modo === "login"
      ? await signInWithEmailAndPassword(auth, correo, contrasena)
      : await createUserWithEmailAndPassword(auth, correo, contrasena);
  try {
    const idToken = await credencial.user.getIdToken();
    const respuesta = await fetch(RUTA_SESION, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    await lanzarSiFalla(respuesta);
  } finally {
    await signOut(auth);
  }
}

export async function cerrarSesion(): Promise<void> {
  await lanzarSiFalla(await fetch(RUTA_SESION, { method: "DELETE" }));
}
