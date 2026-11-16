"use client";

import { useEffect, useRef } from "react";

interface PropsError {
  error: unknown;
  retry: () => void;
}

/** Error inesperado: mensaje sin detalles internos, foco en el título y reintento. */
export default function ErrorDePagina({ error, retry }: PropsError) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const digest =
    error instanceof Error && "digest" in error ? String(error.digest) : null;

  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <section className="tarjeta" aria-labelledby="titulo-error">
      <h1 id="titulo-error" ref={titulo} tabIndex={-1}>
        Algo salió mal
      </h1>
      <p>No pudimos cargar esta página. Inténtalo de nuevo en un momento.</p>
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
