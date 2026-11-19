"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCerrarMenu } from "./contexto-menu";

interface PropsEnlace {
  href: string;
  texto: string;
  icono: ReactNode;
  /** Marca el enlace como la página actual (`aria-current="page"`). */
  activo: boolean;
}

/** Enlace del menú lateral: icono decorativo + texto; cierra el panel al elegirlo. */
export function EnlaceMenu({ href, texto, icono, activo }: PropsEnlace) {
  const cerrar = useCerrarMenu();
  return (
    <Link
      href={href}
      className="enlace-menu"
      aria-current={activo ? "page" : undefined}
      onClick={cerrar}
    >
      {icono}
      <span className="enlace-menu__texto">{texto}</span>
    </Link>
  );
}
