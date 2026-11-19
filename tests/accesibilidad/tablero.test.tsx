import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Tarea } from "@/schemas/tarea";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
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
import { TableroTareas } from "@/components/tareas/TableroTareas";
import { simularDialogoNativo } from "../ayudas";
import { problemasDeAccesibilidad } from "./axe";

/** Reto «Pruebas de accesibilidad de componentes con axe»: tablero y filtros. */

const base: Tarea = {
  id: "t1",
  titulo: "Maqueta",
  descripcion: "",
  estado: "pendiente",
  prioridad: "alta",
  responsableUid: "u2",
  vence: "2026-12-01",
  creadaPor: "u1",
  creadaEn: "2026-11-16T10:00:00.000Z",
};
const tareas: Tarea[] = [
  base,
  { ...base, id: "t2", titulo: "Informe", estado: "hecha", vence: null },
];
const miembros = [
  { uid: "u2", nombre: "bea@ejemplo.com" },
  { uid: "u3", nombre: "carlos@ejemplo.com" },
];

function tablero(
  permisos: { crear: boolean; editar: boolean },
  lista = tareas,
) {
  return (
    <TableroTareas
      proyectoId="p1"
      tareas={lista}
      miembros={miembros}
      puedeCrear={permisos.crear}
      puedeEditar={permisos.editar}
      hayFiltros={false}
      rutaSinFiltros="/proyectos/p1"
    />
  );
}

beforeEach(() => simularDialogoNativo());

describe("axe · TableroTareas", () => {
  it("como lector (solo lectura): sin violaciones", async () => {
    const { container } = render(tablero({ crear: false, editar: false }));
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });

  it("como editor (selector de estado y botones): sin violaciones", async () => {
    const { container } = render(tablero({ crear: true, editar: true }));
    expect(
      screen.getByRole("combobox", { name: "Estado Maqueta" }),
    ).toBeVisible();
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });

  it("sin tareas (estado vacío): sin violaciones", async () => {
    const { container } = render(tablero({ crear: true, editar: true }, []));
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });
});

describe("axe · diálogo de tarea y filtros", () => {
  it("el diálogo de nueva tarea abierto, con su error de título", async () => {
    const { container } = render(tablero({ crear: true, editar: true }));
    await userEvent.click(screen.getByRole("button", { name: "Nueva tarea" }));
    const ventana = screen.getByRole("dialog", { name: "Nueva tarea" });
    await userEvent.click(screen.getByRole("button", { name: "Crear tarea" }));
    expect(ventana).toBeVisible();
    expect(screen.getByLabelText("Título")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });

  it.each([
    {},
    { estado: "hecha" as const, responsable: "u3" },
    { mias: "1" as const },
  ])("BarraFiltros con filtros %o: sin violaciones", async (filtros) => {
    const { container } = render(
      <BarraFiltros
        base="/proyectos/p1"
        filtros={filtros}
        miembros={miembros}
      />,
    );
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });
});
