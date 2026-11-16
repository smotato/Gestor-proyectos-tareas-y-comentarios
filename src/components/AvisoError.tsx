"use client";

import { useEffect, useRef } from "react";

interface PropsAvisoError {
  error: unknown;
  retry: () => void;
  /** h1 si reemplaza la página entera; h2 dentro de un layout que ya tiene h1. */
  nivel: "h1" | "h2";
  mensaje?: string;
}

/** Estado de error con foco en el título y botón de reintento. */
export function AvisoError({ error, retry, nivel, mensaje }: PropsAvisoError) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const digest =
    error instanceof Error && "digest" in error ? String(error.digest) : null;
  const Titulo = nivel;

  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <section className="tarjeta" aria-labelledby="titulo-error">
      <Titulo id="titulo-error" ref={titulo} tabIndex={-1}>
        Algo salió mal
      </Titulo>
      <p>
        {mensaje ??
          "No pudimos cargar esta página. Inténtalo de nuevo en un momento."}
      </p>
      {digest ? (
        <p className="texto-tenue">
          Código de referencia: <code>{digest}</code>
        </p>
      ) : null}
      <button type="button" className="boton" onClick={() => retry()}>
        Reintentar
      </button>
    </section>
  );
}
