import type { ReactNode } from "react";
import type { Prioridad } from "@/schemas/tarea";

/** SVG en línea, decorativo (aria-hidden): el texto del botón o enlace es el nombre. */
function Icono({ children }: { children: ReactNode }) {
  return (
    <svg
      className="icono"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconoMenu() {
  return (
    <Icono>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icono>
  );
}

export function IconoCerrar() {
  return (
    <Icono>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icono>
  );
}

export function IconoContraer({ contraido }: { contraido: boolean }) {
  const trazo = contraido
    ? "M13 6l6 6-6 6M5 6l6 6-6 6"
    : "M11 6l-6 6 6 6M19 6l-6 6 6 6";
  return (
    <Icono>
      <path d={trazo} />
    </Icono>
  );
}

export function IconoProyectos() {
  return (
    <Icono>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </Icono>
  );
}

export function IconoTablero() {
  return (
    <Icono>
      <path d="M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z" />
    </Icono>
  );
}

export function IconoTareas() {
  return (
    <Icono>
      <path d="M9 11l3 3 8-8M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
    </Icono>
  );
}

export function IconoMiembros() {
  return (
    <Icono>
      <path d="M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-2a4 4 0 00-3-3.9M16 3.1a3.5 3.5 0 010 6.8" />
    </Icono>
  );
}

export function IconoEntrar() {
  return (
    <Icono>
      <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H3" />
    </Icono>
  );
}

export function IconoSalir() {
  return (
    <Icono>
      <path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3M16 17l5-5-5-5M21 12H9" />
    </Icono>
  );
}

const TRAZO_PRIORIDAD: Readonly<Record<Prioridad, string>> = {
  alta: "M12 19V5M5 12l7-7 7 7",
  media: "M5 12h14",
  baja: "M12 5v14M19 12l-7 7-7-7",
};

/** Flecha hacia arriba, guion o flecha hacia abajo según la prioridad. */
export function IconoPrioridad({ nivel }: { nivel: Prioridad }) {
  return (
    <Icono>
      <path d={TRAZO_PRIORIDAD[nivel]} />
    </Icono>
  );
}

export function IconoAlerta() {
  return (
    <Icono>
      <path d="M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icono>
  );
}
