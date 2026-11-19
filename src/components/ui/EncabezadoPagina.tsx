import type { ReactNode } from "react";

interface PropsEncabezado {
  /** El único `<h1>` de la página. */
  titulo: string;
  /** Texto de apoyo bajo el título (opcional). */
  descripcion?: ReactNode;
  /** Acción principal de la página, a la derecha del título (opcional). */
  accion?: ReactNode;
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  accion,
}: PropsEncabezado) {
  return (
    <div className="encabezado-pagina">
      <div className="encabezado-pagina__texto">
        <h1 className="encabezado-pagina__titulo">{titulo}</h1>
        {descripcion ? <p className="texto-tenue">{descripcion}</p> : null}
      </div>
      {accion}
    </div>
  );
}
