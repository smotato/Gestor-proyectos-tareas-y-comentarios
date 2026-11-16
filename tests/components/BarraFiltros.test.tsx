import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...resto
  }: {
    href: string;
    children: string;
  }) => (
    <a href={href} {...resto}>
      {children}
    </a>
  ),
}));

import { BarraFiltros } from "@/components/tareas/BarraFiltros";
import type { FiltrosTareas } from "@/schemas/consulta-tareas";

const miembros = [
  { uid: "u2", nombre: "bea@ejemplo.com" },
  { uid: "u3", nombre: "carlos@ejemplo.com" },
];

function pintar(filtros: FiltrosTareas) {
  render(
    <BarraFiltros base="/proyectos/p1" filtros={filtros} miembros={miembros} />,
  );
}

describe("BarraFiltros", () => {
  it("es un formulario GET con estado y responsable según los filtros de la URL", () => {
    pintar({ estado: "hecha", responsable: "u3" });
    expect(screen.getByLabelText("Estado")).toHaveValue("hecha");
    expect(screen.getByLabelText("Responsable")).toHaveValue("u3");
    const boton = screen.getByRole("button", { name: "Aplicar filtros" });
    expect(boton.closest("form")).toHaveAttribute("method", "get");
    expect(boton.closest("form")).toHaveAttribute("action", "/proyectos/p1");
  });

  it("marca 'Todas las tareas' como la vista actual y enlaza 'Mis tareas'", () => {
    pintar({});
    expect(
      screen.getByRole("link", { name: "Todas las tareas" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Mis tareas" })).toHaveAttribute(
      "href",
      "/proyectos/p1?mias=1",
    );
  });

  it("en 'Mis tareas' conserva mias=1 y no ofrece elegir responsable", () => {
    pintar({ mias: "1" });
    expect(screen.getByRole("link", { name: "Mis tareas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByLabelText("Responsable")).toBeNull();
    const oculto = document.querySelector('input[type="hidden"][name="mias"]');
    expect(oculto).toHaveValue("1");
  });
});
