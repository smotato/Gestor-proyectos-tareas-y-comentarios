import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/api-cliente";
import type { Rol } from "@/schemas/rol";

const pedirApi = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-cliente", async (original) => ({
  ...(await original<typeof import("@/lib/api-cliente")>()),
  pedirApi,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { AccionesMiembro } from "@/components/proyectos/AccionesMiembro";

const base = { proyectoId: "p1", uid: "u2", nombre: "bea@ejemplo.com" };
const TODOS_LOS_ROLES: Rol[] = ["propietario", "editor", "lector"];

/** Muestra las acciones sobre un miembro que se puede cambiar y quitar. */
function renderMiembroGestionable(rol: Rol) {
  render(
    <AccionesMiembro
      {...base}
      rol={rol}
      rolesPermitidos={TODOS_LOS_ROLES}
      puedeQuitar
    />,
  );
}

beforeEach(() => vi.resetAllMocks());

describe("AccionesMiembro · último propietario", () => {
  it("no ofrece cambiar el rol ni quitarlo", () => {
    render(
      <AccionesMiembro
        {...base}
        rol="propietario"
        rolesPermitidos={["propietario"]}
        puedeQuitar={false}
      />,
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quitar del proyecto" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/único propietario/i)).toBeInTheDocument();
  });
});

describe("AccionesMiembro · miembro que se puede gestionar", () => {
  it("cambia el rol con PATCH y anuncia el resultado", async () => {
    pedirApi.mockResolvedValue({});
    renderMiembroGestionable("editor");
    await userEvent.selectOptions(
      screen.getByLabelText("Rol de bea@ejemplo.com"),
      "lector",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar rol" }));
    expect(pedirApi).toHaveBeenCalledWith("/api/proyectos/p1/miembros/u2", {
      method: "PATCH",
      body: { rol: "lector" },
    });
    expect(await screen.findByText("Rol actualizado.")).toHaveAttribute(
      "role",
      "status",
    );
  });

  it("muestra el error de la API (por ejemplo, 409)", async () => {
    pedirApi.mockRejectedValue(new ErrorApi(409, "Debe quedar un propietario"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderMiembroGestionable("lector");
    await userEvent.click(
      screen.getByRole("button", { name: "Quitar del proyecto" }),
    );
    expect(
      await screen.findByText("Debe quedar un propietario"),
    ).toHaveAttribute("role", "status");
  });
});
