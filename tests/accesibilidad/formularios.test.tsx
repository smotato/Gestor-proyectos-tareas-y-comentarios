import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sesion-cliente", () => ({ iniciarSesion: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { FormularioCredenciales } from "@/components/FormularioCredenciales";
import { GenerarInvitacion } from "@/components/invitaciones/GenerarInvitacion";
import { FormularioComentario } from "@/components/tareas/FormularioComentario";
import { problemasDeAccesibilidad } from "./axe";

/** Reto «Pruebas de accesibilidad de componentes con axe»: formularios. */

describe("axe · FormularioCredenciales", () => {
  it("inicio de sesión: sin violaciones", async () => {
    const { container } = render(<FormularioCredenciales modo="login" />);
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });

  it("registro: sin violaciones", async () => {
    const { container } = render(<FormularioCredenciales modo="registro" />);
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });

  it("con errores de validación (aria-invalid y aria-describedby): sin violaciones", async () => {
    const { container } = render(<FormularioCredenciales modo="login" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );
    const correo = screen.getByLabelText("Correo electrónico");
    expect(correo).toHaveAttribute("aria-invalid", "true");
    expect(correo).toHaveAccessibleDescription(/correo válido/i);
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });
});

describe("axe · formularios de la aplicación", () => {
  it("FormularioComentario, vacío y con el error visible", async () => {
    const { container } = render(
      <FormularioComentario proyectoId="p1" tareaId="t1" />,
    );
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Comentar" }));
    expect(screen.getByLabelText("Escribe un comentario")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });

  it("GenerarInvitacion (propietario): sin violaciones", async () => {
    const { container } = render(<GenerarInvitacion proyectoId="p1" />);
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });
});
