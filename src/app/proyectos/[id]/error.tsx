"use client";

import { AvisoError } from "@/components/AvisoError";

interface PropsError {
  error: unknown;
  retry: () => void;
}

/** Dentro del layout del proyecto (que ya tiene h1): el título es h2. */
export default function ErrorDeProyecto({ error, retry }: PropsError) {
  return (
    <AvisoError
      error={error}
      retry={retry}
      nivel="h2"
      mensaje="No pudimos cargar esta sección del proyecto."
    />
  );
}
