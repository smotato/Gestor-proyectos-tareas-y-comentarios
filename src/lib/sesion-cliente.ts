import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type { Credenciales } from "@/schemas/sesion";
import { pedirApi } from "./api-cliente";
import { authCliente } from "./firebase/cliente";

/** Funciones del navegador: Firebase Auth + la API propia. */

export type ModoAcceso = "login" | "registro";

const RUTA_SESION = "/api/auth/sesion";

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
    await pedirApi(RUTA_SESION, { method: "POST", body: { idToken } });
  } finally {
    await signOut(auth);
  }
}

export async function cerrarSesion(): Promise<void> {
  await pedirApi(RUTA_SESION, { method: "DELETE" });
}
