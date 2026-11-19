"use client";

import { createContext, useContext } from "react";

interface ContextoMenu {
  /** Cierra el panel en pantallas pequeñas (al elegir un enlace). */
  cerrar: () => void;
}

const ContextoMenu = createContext<ContextoMenu>({ cerrar: () => {} });

export const ProveedorMenu = ContextoMenu.Provider;

export function useCerrarMenu(): () => void {
  return useContext(ContextoMenu).cerrar;
}
