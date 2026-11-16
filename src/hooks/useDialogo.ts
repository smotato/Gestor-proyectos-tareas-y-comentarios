"use client";

import { useEffect, useRef } from "react";

/**
 * Controla un `<dialog>` nativo: `showModal()` lo hace modal (el resto de la
 * página queda inerte, así el foco no escapa) y al cerrarlo —con Esc, con el
 * botón o desde el código— el foco vuelve al elemento que lo abrió.
 */
export function useDialogo(abierto: boolean, alCerrar: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const abridor = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) {
      const activo = document.activeElement;
      abridor.current = activo instanceof HTMLElement ? activo : null;
      dialogo.showModal();
    } else if (!abierto && dialogo.open) {
      dialogo.close();
    }
  }, [abierto]);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    const alEvento = () => {
      abridor.current?.focus();
      alCerrar();
    };
    dialogo.addEventListener("close", alEvento);
    return () => dialogo.removeEventListener("close", alEvento);
  }, [alCerrar]);

  return ref;
}
