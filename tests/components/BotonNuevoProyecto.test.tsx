import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { simularDialogoNativo } from "../ayudas";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { BotonNuevoProyecto } from "@/components/proyectos/BotonNuevoProyecto";

beforeEach(() => simularDialogoNativo());

describe("BotonNuevoProyecto", () => {
  it("abre el formulario en un diálogo y Cerrar devuelve el foco al botón", async () => {
    render(<BotonNuevoProyecto />);
    const abrir = screen.getByRole("button", { name: "Nuevo proyecto" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(abrir);
    const ventana = screen.getByRole("dialog", { name: "Nuevo proyecto" });
    expect(
      within(ventana).getByLabelText("Nombre del proyecto"),
    ).toBeInTheDocument();
    expect(
      within(ventana).getByRole("button", { name: "Crear proyecto" }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(ventana).getByRole("button", { name: "Cerrar" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(abrir).toHaveFocus();
  });

  it("acepta un texto propio para el botón", () => {
    render(<BotonNuevoProyecto texto="Crear mi primer proyecto" />);
    expect(
      screen.getByRole("button", { name: "Crear mi primer proyecto" }),
    ).toBeInTheDocument();
  });
});
