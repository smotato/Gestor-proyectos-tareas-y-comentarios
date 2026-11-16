import { getApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  connectAuthEmulator,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth";

/**
 * Firebase en el navegador: SOLO Auth (nunca `firebase/firestore`).
 * La configuración NEXT_PUBLIC_* es pública por diseño.
 */

/** Puerto del emulador de Auth definido en firebase.json. */
const URL_EMULADOR_AUTH = "http://127.0.0.1:9099";

let auth: Auth | null = null;

function appCliente() {
  if (getApps().length > 0) return getApp();
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

/**
 * La sesión real es la cookie HttpOnly; el navegador no guarda tokens
 * (persistencia en memoria y se cierra la sesión de Firebase tras crear la cookie).
 */
export function authCliente(): Auth {
  if (auth) return auth;
  auth = initializeAuth(appCliente(), { persistence: inMemoryPersistence });
  if (process.env.NEXT_PUBLIC_USAR_EMULADORES === "true") {
    connectAuthEmulator(auth, URL_EMULADOR_AUTH, { disableWarnings: true });
  }
  return auth;
}
