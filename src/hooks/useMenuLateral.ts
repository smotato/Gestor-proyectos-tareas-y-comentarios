"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const CLAVE = "menu-lateral-contraido";
const EVENTO = "menu-lateral-cambio";
const ESCRITORIO = "(min-width: 64rem)";

/** Respaldo en memoria para cuando localStorage no se puede usar. */
let enMemoria = false;

/** localStorage puede faltar o lanzar (modo privado, datos bloqueados). */
function leerContraido(): boolean {
  try {
    const guardado = window.localStorage.getItem(CLAVE);
    if (guardado !== null) return guardado === "1";
  } catch {
    // Se usa el respaldo en memoria.
  }
  return enMemoria;
}

function guardarContraido(valor: boolean) {
  try {
    window.localStorage.setItem(CLAVE, valor ? "1" : "0");
  } catch {
    // Sin almacenamiento el menú funciona igual; solo no recuerda el estado.
    enMemoria = valor;
  }
  window.dispatchEvent(new Event(EVENTO));
}

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

/** Estado contraído del escritorio; se recuerda entre visitas. */
function useContraido() {
  const contraido = useSyncExternalStore(suscribir, leerContraido, () => false);
  const alternar = useCallback(() => guardarContraido(!leerContraido()), []);
  return { contraido, alternar };
}

/** Escape cierra el panel; al pasar a escritorio el panel deja de serlo. */
function useCierreAutomatico(abierto: boolean, cerrar: () => void) {
  useEffect(() => {
    if (!abierto) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    const consulta = window.matchMedia(ESCRITORIO);
    const alCambiar = (e: MediaQueryListEvent) => {
      if (e.matches) cerrar();
    };
    document.addEventListener("keydown", alTecla);
    consulta.addEventListener("change", alCambiar);
    return () => {
      document.removeEventListener("keydown", alTecla);
      consulta.removeEventListener("change", alCambiar);
    };
  }, [abierto, cerrar]);
}

/** Ids de los dos elementos entre los que se mueve el foco. */
export const ID_BOTON_MENU = "boton-menu";
export const ID_PANEL_MENU = "menu-lateral";

/** El foco entra al panel al abrirlo y vuelve al botón "Menú" al cerrarlo. */
function useFocoDelPanel(abierto: boolean) {
  const eraAbierto = useRef(false);
  useEffect(() => {
    if (abierto) {
      const panel = document.getElementById(ID_PANEL_MENU);
      panel?.querySelector<HTMLElement>("button, a")?.focus();
    } else if (eraAbierto.current) {
      document.getElementById(ID_BOTON_MENU)?.focus();
    }
    eraAbierto.current = abierto;
  }, [abierto]);
}

/** Estado del menú lateral: panel abierto (móvil) y contraído (escritorio). */
export function useMenuLateral() {
  const [abierto, setAbierto] = useState(false);
  const { contraido, alternar } = useContraido();
  const cerrar = useCallback(() => setAbierto(false), []);
  const abrir = useCallback(() => setAbierto(true), []);
  useCierreAutomatico(abierto, cerrar);
  useFocoDelPanel(abierto);
  return { abierto, contraido, abrir, cerrar, alternar };
}
