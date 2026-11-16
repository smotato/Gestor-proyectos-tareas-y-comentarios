"use client";

import { AvisoError } from "@/components/AvisoError";

interface PropsError {
  error: unknown;
  retry: () => void;
}

/** Error inesperado: mensaje sin detalles internos, foco en el título y reintento. */
export default function ErrorDePagina({ error, retry }: PropsError) {
  return <AvisoError error={error} retry={retry} nivel="h1" />;
}
