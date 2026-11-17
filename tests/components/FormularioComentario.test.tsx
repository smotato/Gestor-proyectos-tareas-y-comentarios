import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/api-cliente";

const pedirApi = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-cliente", async (original) => ({
  ...(await original<typeof import("@/lib/api-cliente")>()),
  pedirApi,
}));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { FormularioComentario } from "@/components/tareas/FormularioComentario";

const RUTA = "/api/proyectos/p1/tareas/t1/comentarios";

function pintar() {
  render(<FormularioComentario proyectoId="p1" tareaId="t1" />);
  return {
    campo: screen.getByLabelText("Escribe un comentario"),
    boton: screen.getByRole("button", { name: "Comentar" }),
  };
}

beforeEach(() => vi.resetAllMocks());

describe("FormularioComentario", () => {
  it("valida el texto con el esquema de la API y no llama a la API", async () => {
    const { campo, boton } = pintar();
    await userEvent.click(boton);
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription(
      "El comentario no puede estar vacío",
    );
    expect(pedirApi).not.toHaveBeenCalled();
  });

  it("publica el comentario, limpia el campo y anuncia el resultado", async () => {
    pedirApi.mockResolvedValue({});
    const { campo, boton } = pintar();
    await userEvent.type(campo, "Ya subí la maqueta");
    await userEvent.click(boton);
    expect(pedirApi).toHaveBeenCalledWith(RUTA, {
      method: "POST",
      body: { texto: "Ya subí la maqueta" },
    });
    const aviso = await screen.findByText("Comentario publicado.");
    expect(aviso).toHaveAttribute("role", "status");
    expect(campo).toHaveValue("");
    expect(refresh).toHaveBeenCalled();
  });

  it("muestra el error de la API y conserva lo escrito", async () => {
    pedirApi.mockRejectedValue(new ErrorApi(403, "No tienes permiso"));
    const { campo, boton } = pintar();
    await userEvent.type(campo, "Hola");
    await userEvent.click(boton);
    expect(await screen.findByText("No tienes permiso")).toBeVisible();
    expect(campo).toHaveValue("Hola");
    expect(refresh).not.toHaveBeenCalled();
  });
});
