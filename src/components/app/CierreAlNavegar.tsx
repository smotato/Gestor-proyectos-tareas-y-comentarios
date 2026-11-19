"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCerrarMenu } from "./contexto-menu";

/**
 * Cierra el panel del menú cuando cambia la ruta (también con atrás/adelante).
 * Aísla `usePathname()`: va dentro de un <Suspense> para que el resto del
 * marco se prerenderice sin depender de la URL de cada petición.
 */
export function CierreAlNavegar() {
  const ruta = usePathname();
  const cerrar = useCerrarMenu();
  const previa = useRef(ruta);
  useEffect(() => {
    if (previa.current === ruta) return;
    previa.current = ruta;
    cerrar();
  }, [ruta, cerrar]);
  return null;
}
