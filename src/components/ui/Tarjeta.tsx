import { type ReactNode, useId } from "react";

interface PropsTarjeta {
  /** Título de la sección (h2); si falta, la tarjeta es solo un contenedor. */
  titulo?: string;
  children: ReactNode;
}

/** Superficie con borde y sombra sutil para agrupar contenido. */
export function Tarjeta({ titulo, children }: PropsTarjeta) {
  const idTitulo = useId();
  if (!titulo) return <div className="panel">{children}</div>;
  return (
    <section className="panel" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="panel__titulo">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
