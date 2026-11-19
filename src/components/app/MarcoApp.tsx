"use client";

import Link from "next/link";
import { type ReactNode, Suspense, useMemo } from "react";
import {
  ID_BOTON_MENU,
  ID_PANEL_MENU,
  useMenuLateral,
} from "@/hooks/useMenuLateral";
import { CierreAlNavegar } from "./CierreAlNavegar";
import { ProveedorMenu } from "./contexto-menu";
import { IconoCerrar, IconoContraer, IconoMenu } from "./Iconos";

type Menu = ReturnType<typeof useMenuLateral>;

function BarraSuperior({ menu }: { menu: Menu }) {
  return (
    <header className="barra">
      <button
        id={ID_BOTON_MENU}
        type="button"
        className="boton-icono barra__boton-menu"
        aria-expanded={menu.abierto}
        aria-controls={ID_PANEL_MENU}
        onClick={menu.abrir}
      >
        <IconoMenu />
        Menú
      </button>
      <Link href="/" className="barra__marca">
        Gestor de proyectos
      </Link>
    </header>
  );
}

function PanelMenu({ menu, children }: { menu: Menu; children: ReactNode }) {
  const textoContraer = menu.contraido ? "Expandir menú" : "Contraer menú";
  return (
    <div
      id={ID_PANEL_MENU}
      className={`menu-lateral${menu.abierto ? " menu-lateral--abierto" : ""}`}
    >
      <div className="menu-lateral__cabecera">
        <span>Menú</span>
        <button type="button" className="boton-icono" onClick={menu.cerrar}>
          <IconoCerrar />
          <span className="boton-icono__texto">Cerrar menú</span>
        </button>
      </div>
      {children}
      <div className="menu-lateral__pie menu-lateral__contraer">
        <button
          type="button"
          className="boton-icono"
          aria-expanded={!menu.contraido}
          aria-controls={ID_PANEL_MENU}
          onClick={menu.alternar}
        >
          <IconoContraer contraido={menu.contraido} />
          <span className="boton-icono__texto">{textoContraer}</span>
        </button>
      </div>
    </div>
  );
}

interface PropsMarco {
  /** Contenido del menú (enlaces, correo y "Cerrar sesión"), resuelto en el servidor. */
  menu: ReactNode;
  children: ReactNode;
}

/**
 * Marco de la aplicación: barra superior, menú lateral izquierdo y contenido.
 * En pantallas pequeñas el menú es un panel que, abierto, deja inerte el resto.
 */
export function MarcoApp({ menu, children }: PropsMarco) {
  const estado = useMenuLateral();
  const valor = useMemo(() => ({ cerrar: estado.cerrar }), [estado.cerrar]);
  const clases = [
    "marco",
    estado.contraido ? "marco--contraido" : "",
    estado.abierto ? "marco--abierto" : "",
  ];
  return (
    <ProveedorMenu value={valor}>
      <div className={clases.filter(Boolean).join(" ")}>
        <Suspense fallback={null}>
          <CierreAlNavegar />
        </Suspense>
        <BarraSuperior menu={estado} />
        <PanelMenu menu={estado}>{menu}</PanelMenu>
        <button
          type="button"
          className="marco__velo"
          aria-hidden="true"
          tabIndex={-1}
          onClick={estado.cerrar}
        />
        <div className="marco__principal" inert={estado.abierto}>
          <main id="contenido" tabIndex={-1} className="contenido">
            {children}
          </main>
          <footer className="pie">
            <p>Gestor de proyectos · Proyecto de clase</p>
          </footer>
        </div>
      </div>
    </ProveedorMenu>
  );
}
