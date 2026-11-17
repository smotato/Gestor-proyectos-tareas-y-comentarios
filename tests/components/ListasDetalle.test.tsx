import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListaActividad } from "@/components/actividad/ListaActividad";
import { ListaComentarios } from "@/components/tareas/ListaComentarios";
import type { Actividad } from "@/schemas/actividad";
import type { Comentario } from "@/schemas/comentario";

const nombres = new Map([["u2", "bea@ejemplo.com"]]);

const comentarios: Comentario[] = [
  {
    id: "c1",
    uid: "u2",
    texto: "<b>negrita</b> y un enlace <a href=x>x</a>",
    creadoEn: "2026-11-16T10:00:00.000Z",
  },
  {
    id: "c2",
    uid: "u9",
    texto: "Comentario de alguien que ya no está",
    creadoEn: "2026-11-16T11:30:00.000Z",
  },
];

const registros: Actividad[] = [
  {
    id: "a2",
    uid: "u2",
    accion: "estadoCambiado",
    detalle: "Cambió el estado de «Maqueta» de Pendiente a Hecha",
    creadoEn: "2026-11-16T11:30:00.000Z",
  },
  {
    id: "a1",
    uid: "u9",
    accion: "tareaCreada",
    detalle: "Creó la tarea «Maqueta»",
    creadoEn: "2026-11-16T10:00:00.000Z",
  },
];

describe("ListaComentarios", () => {
  it("sin comentarios muestra el estado vacío", () => {
    render(<ListaComentarios items={[]} nombres={nombres} />);
    expect(screen.getByText(/todavía no hay comentarios/i)).toBeVisible();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("muestra autor y fecha, y el texto como texto plano (sin HTML)", () => {
    const { container } = render(
      <ListaComentarios items={comentarios} nombres={nombres} />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("bea@ejemplo.com")).toBeVisible();
    expect(screen.getByText("Un exmiembro")).toBeVisible();
    expect(screen.getByText(/<b>negrita<\/b>/)).toBeVisible();
    expect(container.querySelector("b, a")).toBeNull();
    const horas = screen.getAllByText(/UTC/);
    expect(horas[0]).toHaveAttribute("datetime", "2026-11-16T10:00:00.000Z");
  });
});

describe("ListaActividad", () => {
  it("sin actividad muestra el estado vacío", () => {
    render(<ListaActividad items={[]} nombres={nombres} hayMas={false} />);
    expect(screen.getByText(/todavía no hay actividad/i)).toBeVisible();
  });

  it("muestra quién, qué y cuándo, en el orden recibido", () => {
    render(
      <ListaActividad items={registros} nombres={nombres} hayMas={false} />,
    );
    const filas = screen.getAllByRole("listitem");
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveTextContent("bea@ejemplo.com");
    expect(filas[0]).toHaveTextContent("Pendiente a Hecha");
    expect(filas[1]).toHaveTextContent("Un exmiembro");
    expect(screen.queryByText(/más recientes/i)).toBeNull();
  });

  it("avisa cuando hay registros más antiguos que no se muestran", () => {
    render(<ListaActividad items={registros} nombres={nombres} hayMas />);
    expect(screen.getByText(/2 registros más recientes/i)).toBeVisible();
  });
});
