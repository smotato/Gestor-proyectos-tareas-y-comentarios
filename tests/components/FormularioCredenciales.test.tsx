import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const iniciarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion-cliente", () => ({ iniciarSesion }));

import { FormularioCredenciales } from "@/components/FormularioCredenciales";

const assign = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("location", { ...window.location, assign });
});

afterEach(() => vi.unstubAllGlobals());

describe("FormularioCredenciales", () => {
  it("tiene campos con etiqueta y el autocompletado correcto", () => {
    render(<FormularioCredenciales modo="registro" />);
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(
      screen.getByRole("button", { name: "Crear cuenta" }),
    ).toBeInTheDocument();
  });

  it("muestra los errores junto al campo y no llama a Firebase", async () => {
    render(<FormularioCredenciales modo="login" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );
    const correo = screen.getByLabelText("Correo electrónico");
    expect(correo).toHaveAttribute("aria-invalid", "true");
    expect(correo).toHaveAccessibleDescription(/correo válido/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/revisa/i);
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  it("envía las credenciales válidas", async () => {
    iniciarSesion.mockResolvedValue(undefined);
    render(<FormularioCredenciales modo="login" />);
    await userEvent.type(
      screen.getByLabelText("Correo electrónico"),
      "ana@ejemplo.com",
    );
    await userEvent.type(screen.getByLabelText("Contraseña"), "secreta");
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );
    expect(iniciarSesion).toHaveBeenCalledWith("login", {
      correo: "ana@ejemplo.com",
      contrasena: "secreta",
    });
  });
});
