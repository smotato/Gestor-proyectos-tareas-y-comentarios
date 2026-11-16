import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/api-cliente";
import type { Tarea } from "@/schemas/tarea";

const pedirApi = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-cliente", async (original) => ({
  ...(await original<typeof import("@/lib/api-cliente")>()),
  pedirApi,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { TableroTareas } from "@/components/tareas/TableroTareas";

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
  {
    ...base,
    id: "t2",
    titulo: "Informe",
    estado: "hecha",
    responsableUid: null,
    vence: null,
  },
];
const miembros = [
  { uid: "u2", nombre: "bea@ejemplo.com" },
  { uid: "u3", nombre: "carlos@ejemplo.com" },
];

function pintar(puedeCrear: boolean, puedeEditar: boolean) {
  render(
    <TableroTareas
      proyectoId="p1"
      tareas={tareas}
      miembros={miembros}
      puedeCrear={puedeCrear}
      puedeEditar={puedeEditar}
      hayFiltros={false}
      rutaSinFiltros="/proyectos/p1"
    />,
  );
}

const columna = (nombre: RegExp) =>
  screen.getByRole("region", { name: nombre });

/** `<dialog>` de jsdom no implementa showModal/close: se simula lo básico. */
const dialogo = { modales: 0 };
beforeEach(() => {
  vi.resetAllMocks();
  dialogo.modales = 0;
  HTMLDialogElement.prototype.showModal = function () {
    dialogo.modales += 1;
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

describe("TableroTareas · lector", () => {
  it("ve las tareas por columna pero no los botones de crear ni editar", () => {
    pintar(false, false);
    expect(within(columna(/Pendiente/)).getByText("Maqueta")).toBeVisible();
    expect(within(columna(/Hecha/)).getByText("Informe")).toBeVisible();
    expect(screen.getByText("bea@ejemplo.com")).toBeVisible();
    expect(screen.queryByRole("button", { name: /nueva tarea/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /editar/i })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});

describe("TableroTareas · editor", () => {
  it("ve los botones de crear y editar y el selector de estado", () => {
    pintar(true, true);
    expect(screen.getByRole("button", { name: "Nueva tarea" })).toBeVisible();
    const editar = screen.getByRole("button", { name: "Editar tarea Maqueta" });
    expect(editar).toBeVisible();
    expect(
      screen.getByRole("combobox", { name: "Estado Maqueta" }),
    ).toBeVisible();
  });
});

describe("TableroTareas · cambio de estado", () => {
  it("cambia el estado al instante (useOptimistic) y lo confirma con la API", async () => {
    const pendiente = Promise.withResolvers<void>();
    pedirApi.mockReturnValue(pendiente.promise);
    pintar(true, true);
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Estado Maqueta" }),
      "hecha",
    );
    expect(within(columna(/Hecha/)).getByText("Maqueta")).toBeVisible();
    expect(pedirApi).toHaveBeenCalledWith("/api/proyectos/p1/tareas/t1", {
      method: "PATCH",
      body: { estado: "hecha" },
    });
    await act(async () => pendiente.resolve());
  });

  it("si la API falla, la tarea vuelve a su columna y se avisa del error", async () => {
    pedirApi.mockRejectedValue(new ErrorApi(403, "No tienes permiso"));
    pintar(true, true);
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Estado Maqueta" }),
      "hecha",
    );
    const aviso = await screen.findByText("No tienes permiso");
    expect(aviso).toHaveAttribute("role", "alert");
    await waitFor(() =>
      expect(within(columna(/Pendiente/)).getByText("Maqueta")).toBeVisible(),
    );
  });
});

describe("TableroTareas · diálogo de tarea", () => {
  it("crea una tarea: valida con Zod, envía a la API y devuelve el foco", async () => {
    pedirApi.mockResolvedValue({});
    pintar(true, true);
    const abrir = screen.getByRole("button", { name: "Nueva tarea" });
    await userEvent.click(abrir);
    expect(dialogo.modales).toBe(1);
    const ventana = screen.getByRole("dialog", { name: "Nueva tarea" });
    await userEvent.click(
      within(ventana).getByRole("button", { name: "Guardar" }),
    );
    expect(within(ventana).getByText("El título es obligatorio")).toBeVisible();
    expect(pedirApi).not.toHaveBeenCalled();
    await userEvent.type(
      within(ventana).getByLabelText("Título"),
      "Preparar demo",
    );
    await userEvent.click(
      within(ventana).getByRole("button", { name: "Guardar" }),
    );
    expect(pedirApi).toHaveBeenCalledWith("/api/proyectos/p1/tareas", {
      method: "POST",
      body: {
        titulo: "Preparar demo",
        descripcion: "",
        prioridad: "media",
        responsableUid: null,
        vence: null,
      },
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(abrir).toHaveFocus();
  });
});

describe("TableroTareas · edición", () => {
  it("edita una tarea con sus datos y Cancelar devuelve el foco", async () => {
    pedirApi.mockResolvedValue({});
    pintar(true, true);
    const abrir = screen.getByRole("button", { name: "Editar tarea Maqueta" });
    await userEvent.click(abrir);
    const ventana = screen.getByRole("dialog", { name: "Editar tarea" });
    expect(within(ventana).getByLabelText("Título")).toHaveValue("Maqueta");
    expect(within(ventana).getByLabelText("Responsable")).toHaveValue("u2");
    await userEvent.click(
      within(ventana).getByRole("button", { name: "Cancelar" }),
    );
    expect(pedirApi).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(abrir).toHaveFocus();
  });
});
