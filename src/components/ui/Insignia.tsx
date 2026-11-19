import type { ReactNode } from "react";

export type TonoInsignia = "neutra" | "exito" | "aviso" | "error" | "info";

interface PropsInsignia {
  tono?: TonoInsignia;
  /** Icono decorativo (aria-hidden) que acompaña al texto. */
  icono?: ReactNode;
  children: string;
}

/** Etiqueta corta de estado: lleva siempre texto, el color solo la refuerza. */
export function Insignia({ tono = "neutra", icono, children }: PropsInsignia) {
  const clases = tono === "neutra" ? "insignia" : `insignia insignia--${tono}`;
  return (
    <span className={clases}>
      {icono}
      {children}
    </span>
  );
}
