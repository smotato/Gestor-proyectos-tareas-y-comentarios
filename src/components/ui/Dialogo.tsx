"use client";

import { type ReactNode, useId } from "react";
import { useDialogo } from "@/hooks/useDialogo";

interface PropsDialogo {
  abierto: boolean;
  /** Debe ser estable (`useCallback`): se engancha al evento `close`. */
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
}

/**
 * Diálogo modal nativo (`<dialog>`): atrapa el foco, se cierra con Esc y
 * devuelve el foco a quien lo abrió. El contenido solo existe mientras está abierto.
 */
export function Dialogo({ abierto, onCerrar, titulo, children }: PropsDialogo) {
  const ref = useDialogo(abierto, onCerrar);
  const idTitulo = useId();
  return (
    <dialog ref={ref} className="dialogo" aria-labelledby={idTitulo}>
      {abierto ? (
        <>
          <h2 id={idTitulo}>{titulo}</h2>
          {children}
        </>
      ) : null}
    </dialog>
  );
}
