import { render, screen } from "@testing-library/react";
import type { MouseEvent, ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { problemasDeAccesibilidad } from "../accesibilidad/axe";

const ruta = vi.hoisted(() => ({ actual: "/proyectos", busqueda: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => ruta.actual,
  useSearchParams: () => new URLSearchParams(ruta.busqueda),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    onClick,
    "aria-current": actual,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    "aria-current"?: "page";
  }) => (
    <a
      href={href}
      className={className}
      aria-current={actual}
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </a>
  ),
}));

import { MarcoApp } from "@/components/app/MarcoApp";
import { NavLateral } from "@/components/app/NavLateral";

function pintar() {
  return render(
    <MarcoApp menu={<NavLateral conSesion />}>
      <h1>Contenido</h1>
    </MarcoApp>,
  );
}

beforeEach(() => {
  ruta.actual = "/proyectos";
  ruta.busqueda = "";
  window.localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

const boton = (nombre: string) => screen.getByRole("button", { name: nombre });
const enlace = (nombre: string) => screen.getByRole("link", { name: nombre });

function esperarActual(nombre: string, activo: boolean) {
  const actual = expect(enlace(nombre));
  if (activo) actual.toHaveAttribute("aria-current", "page");
  else actual.not.toHaveAttribute("aria-current");
}

describe("MarcoApp · apertura y cierre del menú", () => {
  it("tiene la navegación principal y el botón Menú cerrado", () => {
    pintar();
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(nav).toBeInTheDocument();
    const menu = boton("Menú");
    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(menu).toHaveAttribute("aria-controls", "menu-lateral");
  });

  it("se cierra al cambiar de ruta (por ejemplo, con atrás)", async () => {
    const { rerender } = pintar();
    const menu = boton("Menú");
    await userEvent.click(menu);
    ruta.actual = "/proyectos/p1";
    rerender(
      <MarcoApp menu={<NavLateral conSesion />}>
        <h1>Contenido</h1>
      </MarcoApp>,
    );
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  it("se cierra al elegir un enlace", async () => {
    pintar();
    const menu = boton("Menú");
    await userEvent.click(menu);
    await userEvent.click(enlace("Proyectos"));
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });
});

describe("MarcoApp · foco y teclado", () => {
  it("abre el panel, mete el foco dentro y Escape lo cierra devolviendo el foco", async () => {
    pintar();
    const menu = boton("Menú");
    await userEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(boton("Cerrar menú")).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(menu).toHaveFocus();
  });
});

describe("MarcoApp · enlace activo", () => {
  it("marca Proyectos en la lista de proyectos", () => {
    pintar();
    esperarActual("Proyectos", true);
  });

  it("dentro de un proyecto añade Tablero, Mis tareas y Miembros", () => {
    ruta.actual = "/proyectos/p1/miembros";
    pintar();
    esperarActual("Miembros", true);
    esperarActual("Tablero", false);
    expect(enlace("Mis tareas")).toHaveAttribute(
      "href",
      "/proyectos/p1?mias=1",
    );
  });

  it("marca «Mis tareas» cuando el filtro ?mias=1 está activo", () => {
    ruta.actual = "/proyectos/p1";
    ruta.busqueda = "mias=1";
    pintar();
    esperarActual("Mis tareas", true);
    esperarActual("Tablero", false);
  });
});

describe("MarcoApp · contraer en escritorio", () => {
  it("contrae el menú, lo recuerda y avisa con aria-expanded", async () => {
    pintar();
    const contraer = boton("Contraer menú");
    expect(contraer).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(contraer);
    expect(boton("Expandir menú")).toHaveAttribute("aria-expanded", "false");
    expect(window.localStorage.getItem("menu-lateral-contraido")).toBe("1");
  });

  it("sigue funcionando si localStorage lanza un error", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    pintar();
    await userEvent.click(boton("Contraer menú"));
    await userEvent.click(boton("Expandir menú"));
    expect(boton("Contraer menú")).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

describe("MarcoApp · accesibilidad", () => {
  it("no tiene problemas detectables por axe", async () => {
    const { container } = pintar();
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });
});
