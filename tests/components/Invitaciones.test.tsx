import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/api-cliente";

const pedirApi = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-cliente", async (original) => ({
  ...(await original<typeof import("@/lib/api-cliente")>()),
  pedirApi,
}));
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { AceptarInvitacion } from "@/components/invitaciones/AceptarInvitacion";
import { GenerarInvitacion } from "@/components/invitaciones/GenerarInvitacion";
import { TarjetaInvitacion } from "@/components/invitaciones/TarjetaInvitacion";
import type {
  EstadoInvitacion,
  VistaInvitacion,
} from "@/services/invitaciones";

const vista = (estado: EstadoInvitacion): VistaInvitacion => ({
  proyectoId: "p1",
  nombreProyecto: "Tablero de clase",
  rol: "editor",
  estado,
});

beforeEach(() => vi.resetAllMocks());

describe("TarjetaInvitacion", () => {
  it("una invitación válida ofrece aceptarla", () => {
    render(<TarjetaInvitacion vista={vista("valida")} codigo="abc" />);
    expect(screen.getByText("Tablero de clase")).toBeVisible();
    expect(screen.getByText("Editor")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Aceptar invitación" }),
    ).toBeVisible();
  });

  it.each([
    ["usada", /ya fue usada/i],
    ["vencida", /venció/i],
  ] as const)(
    "si está %s lo explica y no ofrece aceptarla",
    (estado, texto) => {
      render(<TarjetaInvitacion vista={vista(estado)} codigo="abc" />);
      expect(screen.getByText(texto)).toBeVisible();
      expect(screen.queryByRole("button")).toBeNull();
    },
  );

  it("si ya eres miembro enlaza al proyecto", () => {
    render(<TarjetaInvitacion vista={vista("miembro")} codigo="abc" />);
    expect(
      screen.getByRole("link", { name: "Ir al proyecto" }),
    ).toHaveAttribute("href", "/proyectos/p1");
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("AceptarInvitacion", () => {
  it("acepta con POST y lleva al proyecto", async () => {
    pedirApi.mockResolvedValue({ proyectoId: "p1", rol: "editor" });
    render(<AceptarInvitacion codigo="abc" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Aceptar invitación" }),
    );
    expect(pedirApi).toHaveBeenCalledWith("/api/invitaciones/abc/aceptar", {
      method: "POST",
    });
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/proyectos/p1"),
    );
  });

  it("muestra el error de la API (410) y no navega", async () => {
    pedirApi.mockRejectedValue(new ErrorApi(410, "Esta invitación venció"));
    render(<AceptarInvitacion codigo="abc" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Aceptar invitación" }),
    );
    const aviso = await screen.findByText("Esta invitación venció");
    expect(aviso).toHaveAttribute("role", "alert");
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("GenerarInvitacion", () => {
  const respuesta = {
    invitacion: {
      codigo: "Zm9vYmFyMTIzNDU2Nzg5MA",
      proyectoId: "p1",
      rol: "editor",
      expira: "2026-11-23T10:00:00.000Z",
      usada: false,
    },
  };

  it("genera el código con el rol elegido y muestra código, enlace y vencimiento", async () => {
    pedirApi.mockResolvedValue(respuesta);
    render(<GenerarInvitacion proyectoId="p1" />);
    await userEvent.selectOptions(
      screen.getByLabelText("Rol de la invitación"),
      "editor",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Generar código" }),
    );
    expect(pedirApi).toHaveBeenCalledWith("/api/proyectos/p1/invitaciones", {
      method: "POST",
      body: { rol: "editor" },
    });
    expect(await screen.findByText("Zm9vYmFyMTIzNDU2Nzg5MA")).toBeVisible();
    const enlace = `${window.location.origin}/invitacion/Zm9vYmFyMTIzNDU2Nzg5MA`;
    expect(screen.getByText(enlace)).toBeVisible();
    expect(screen.getByText(/23 nov 2026/)).toBeVisible();
  });
});

describe("GenerarInvitacion · errores", () => {
  it("por defecto invita como lector y muestra el error de la API", async () => {
    pedirApi.mockRejectedValue(new ErrorApi(403, "No tienes permiso"));
    render(<GenerarInvitacion proyectoId="p1" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Generar código" }),
    );
    expect(pedirApi).toHaveBeenCalledWith("/api/proyectos/p1/invitaciones", {
      method: "POST",
      body: { rol: "lector" },
    });
    expect(await screen.findByText("No tienes permiso")).toBeVisible();
    expect(screen.queryByText(/invitación creada/i)).toBeNull();
  });
});
