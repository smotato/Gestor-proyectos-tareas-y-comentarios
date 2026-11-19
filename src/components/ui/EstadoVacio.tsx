import type { ReactNode } from "react";

interface PropsEstadoVacio {
  /** Qué falta, en una frase corta (opcional). */
  titulo?: string;
  /** Qué puede hacer la persona. */
  mensaje: string;
  /** Botón o enlace que resuelve el vacío (opcional). */
  accion?: ReactNode;
}

/** Pantalla o sección sin datos: mensaje claro y, si se puede, una acción. */
export function EstadoVacio({ titulo, mensaje, accion }: PropsEstadoVacio) {
  return (
    <div className="estado-vacio">
      {titulo ? <p className="estado-vacio__titulo">{titulo}</p> : null}
      <p>{mensaje}</p>
      {accion}
    </div>
  );
}
