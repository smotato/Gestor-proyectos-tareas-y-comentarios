const CREDENCIALES_INCORRECTAS = "Correo o contraseña incorrectos.";
const MENSAJE_GENERICO =
  "No se pudo completar la operación. Inténtalo de nuevo.";

const MENSAJES: Readonly<Record<string, string>> = {
  "auth/invalid-credential": CREDENCIALES_INCORRECTAS,
  "auth/user-not-found": CREDENCIALES_INCORRECTAS,
  "auth/wrong-password": CREDENCIALES_INCORRECTAS,
  "auth/invalid-email": "El correo no es válido.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
  "auth/weak-password": "La contraseña es demasiado débil.",
  "auth/too-many-requests":
    "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
  "auth/network-request-failed":
    "No hay conexión con el servicio de autenticación.",
};

function codigoDe(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const codigo: unknown = Reflect.get(error, "code");
  return typeof codigo === "string" ? codigo : null;
}

/** Mensaje en español para mostrar al usuario, sin detalles internos. */
export function mensajeDeErrorAuth(error: unknown): string {
  const codigo = codigoDe(error);
  if (codigo !== null && Object.hasOwn(MENSAJES, codigo)) {
    return MENSAJES[codigo] ?? MENSAJE_GENERICO;
  }
  if (error instanceof Error && error.name === "ErrorApi") return error.message;
  return MENSAJE_GENERICO;
}
