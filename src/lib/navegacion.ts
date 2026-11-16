const DESTINO_POR_DEFECTO = "/proyectos";

/**
 * Solo permite rutas internas tras iniciar sesión (evita redirecciones abiertas
 * como `?siguiente=//malo.com`).
 */
export function destinoSeguro(siguiente: string | null): string {
  if (!siguiente?.startsWith("/")) return DESTINO_POR_DEFECTO;
  if (siguiente.startsWith("//") || siguiente.startsWith("/\\")) {
    return DESTINO_POR_DEFECTO;
  }
  return siguiente;
}
