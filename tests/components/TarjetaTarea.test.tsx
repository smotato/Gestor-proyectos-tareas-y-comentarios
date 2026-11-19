import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Tarea } from "@/schemas/tarea";
import { problemasDeAccesibilidad } from "../accesibilidad/axe";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { TarjetaTarea } from "@/components/tareas/TarjetaTarea";

const tarea: Tarea = {
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

function pintar(cambios: Partial<Tarea>, hoy: string) {
  return render(
    <ul>
      <TarjetaTarea
        tarea={{ ...tarea, ...cambios }}
        hoy={hoy}
        rutaDetalle="/proyectos/p1/tareas/t1"
        responsable="bea@ejemplo.com"
        puedeEditar={false}
        onEditar={vi.fn()}
        onCambiarEstado={vi.fn()}
      />
    </ul>,
  );
}

describe("TarjetaTarea · prioridad y vencimiento", () => {
  it("muestra la prioridad con texto (no solo color) y el título como enlace", () => {
    pintar({}, "2026-11-19");
    expect(screen.getByText("Prioridad alta")).toBeVisible();
    expect(screen.getByRole("link", { name: "Maqueta" })).toHaveAttribute(
      "href",
      "/proyectos/p1/tareas/t1",
    );
    expect(screen.queryByText("Vencida")).toBeNull();
  });

  it("marca con el texto «Vencida» una tarea abierta con el día pasado", () => {
    pintar({}, "2026-12-10");
    expect(screen.getByText("Vencida")).toBeVisible();
  });

  it("no marca como vencida una tarea hecha", () => {
    pintar({ estado: "hecha" }, "2026-12-10");
    expect(screen.queryByText("Vencida")).toBeNull();
  });

  it("no tiene problemas de accesibilidad detectables por axe", async () => {
    const { container } = pintar({}, "2026-12-10");
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });
});
