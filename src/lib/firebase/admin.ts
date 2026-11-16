import {
  type App,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

/** Solo servidor: usa la clave privada. Nunca se importa desde el navegador. */

const PROYECTO_DEMO = "demo-gestor-proyectos";

function usarEmuladores(): boolean {
  return process.env.NEXT_PUBLIC_USAR_EMULADORES === "true";
}

function appEmulador(): App {
  // El Admin SDK detecta FIREBASE_AUTH_EMULATOR_HOST y FIRESTORE_EMULATOR_HOST.
  // Sin ellas hablaría con el proyecto real: mejor fallar.
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error(
      "Faltan FIREBASE_AUTH_EMULATOR_HOST/FIRESTORE_EMULATOR_HOST",
    );
  }
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    PROYECTO_DEMO;
  return initializeApp({ projectId });
}

function appProduccion(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const clave = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !clave) {
    throw new Error("Faltan variables FIREBASE_* del servidor");
  }
  // En Vercel la clave llega con "\n" literales.
  const privateKey = clave.replace(/\\n/g, "\n");
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function appAdmin(): App {
  if (getApps().length > 0) return getApp();
  return usarEmuladores() ? appEmulador() : appProduccion();
}

export function authAdmin(): Auth {
  return getAuth(appAdmin());
}

export function firestoreAdmin(): Firestore {
  return getFirestore(appAdmin());
}
