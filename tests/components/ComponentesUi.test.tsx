import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { problemasDeAccesibilidad } from "../accesibilidad/axe";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta } from "@/components/ui/Tarjeta";

describe("Boton", () => {
  it("es un botón de verdad que no envía formularios por defecto", async () => {
    const alClic = vi.fn();
    render(<Boton onClick={alClic}>Guardar</Boton>);
    const boton = screen.getByRole("button", { name: "Guardar" });
    expect(boton).toHaveAttribute("type", "button");
    await userEvent.click(boton);
    expect(alClic).toHaveBeenCalledOnce();
  });

  it("aplica la variante y sirve también para enlaces", () => {
    render(<Boton variante="peligro">Eliminar</Boton>);
    expect(screen.getByRole("button", { name: "Eliminar" })).toHaveClass(
      "boton",
      "boton--peligro",
    );
    expect(clasesBoton()).toBe("boton");
    expect(clasesBoton("secundario")).toBe("boton boton--secundario");
  });
});

describe("Insignia", () => {
  it("muestra siempre el texto, no solo el color", () => {
    render(<Insignia tono="exito">Hecha</Insignia>);
    expect(screen.getByText("Hecha")).toHaveClass("insignia--exito");
  });
});

describe("Tarjeta", () => {
  it("con título es una región con nombre", () => {
    render(<Tarjeta titulo="Crear proyecto">contenido</Tarjeta>);
    expect(
      screen.getByRole("region", { name: "Crear proyecto" }),
    ).toBeInTheDocument();
  });
});

describe("EncabezadoPagina y EstadoVacio", () => {
  it("el título es el h1 y la acción principal está a su lado", () => {
    render(
      <EncabezadoPagina
        titulo="Mis proyectos"
        descripcion="Con tu equipo"
        accion={<Boton>Nuevo</Boton>}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Mis proyectos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo" })).toBeInTheDocument();
  });

  it("el estado vacío dice qué pasa y ofrece una acción", async () => {
    const { container } = render(
      <EstadoVacio
        titulo="Sin tareas"
        mensaje="Crea la primera tarea."
        accion={<Boton>Nueva tarea</Boton>}
      />,
    );
    expect(screen.getByText("Crea la primera tarea.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nueva tarea" }),
    ).toBeInTheDocument();
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });
});
