/**
 * Único punto donde la app escribe en la consola del servidor.
 * Solo registra el id de la petición y el tipo/código del error:
 * nunca mensajes, tokens, contraseñas ni datos personales.
 */
export function registrarErrorInterno(idPeticion: string, error: unknown) {
  const tipo = error instanceof Error ? error.name : typeof error;
  const codigo =
    typeof error === "object" && error !== null
      ? Reflect.get(error, "code")
      : undefined;
  // eslint-disable-next-line no-console -- registro centralizado del servidor
  console.error(
    JSON.stringify({ idPeticion, tipo, codigo: String(codigo ?? "") }),
  );
}
