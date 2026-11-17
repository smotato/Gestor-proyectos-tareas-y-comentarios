import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Actividad } from "@/schemas/actividad";
import type { Comentario } from "@/schemas/comentario";
import type { Tarea } from "@/schemas/tarea";
import type {
  EstadoInvitacion,
  VistaInvitacion,
} from "@/services/invitaciones";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ListaActividad } from "@/components/actividad/ListaActividad";
import { AvisoError } from "@/components/AvisoError";
import { Esqueleto } from "@/components/Esqueleto";
import { TarjetaInvitacion } from "@/components/invitaciones/TarjetaInvitacion";
import { DatosTarea } from "@/components/tareas/DatosTarea";
import { ListaComentarios } from "@/components/tareas/ListaComentarios";
import { problemasDeAccesibilidad } from "./axe";

/** Reto «Pruebas de accesibilidad de componentes con axe»: listas y estados. */

const nombres = new Map([["u2", "bea@ejemplo.com"]]);

const comentarios: Comentario[] = [
  {
    id: "c1",
    uid: "u2",
    texto: "Ya subí la maqueta",
    creadoEn: "2026-11-16T10:00:00.000Z",
  },
  {
    id: "c2",
    uid: "u9",
    texto: "Gracias",
    creadoEn: "2026-11-16T11:30:00.000Z",
  },
];
const registros: Actividad[] = [
  {
    id: "a1",
    uid: "u2",
    accion: "tareaCreada",
    detalle: "Creó la tarea «Maqueta»",
    creadoEn: "2026-11-16T10:00:00.000Z",
  },
];
const tarea: Tarea = {
  id: "t1",
  titulo: "Maqueta",
  descripcion: "",
  estado: "enProgreso",
  prioridad: "media",
  responsableUid: "u2",
  vence: "2026-12-01",
  creadaPor: "u1",
  creadaEn: "2026-11-16T10:00:00.000Z",
};

describe("axe · listas", () => {
  it("ListaComentarios con y sin comentarios", async () => {
    const lleno = render(
      <ListaComentarios items={comentarios} nombres={nombres} />,
    );
    expect(await problemasDeAccesibilidad(lleno.container)).toEqual([]);
    const vacio = render(<ListaComentarios items={[]} nombres={nombres} />);
    expect(await problemasDeAccesibilidad(vacio.container)).toEqual([]);
  });

  it("ListaActividad con registros, vacía y con aviso de «hay más»", async () => {
    for (const [items, hayMas] of [
      [registros, true],
      [registros, false],
      [[], false],
    ] as const) {
      const { container } = render(
        <ListaActividad items={items} nombres={nombres} hayMas={hayMas} />,
      );
      expect(await problemasDeAccesibilidad(container)).toEqual([]);
    }
  });

  it("DatosTarea (lista de definiciones) con y sin responsable", async () => {
    const con = render(
      <DatosTarea tarea={tarea} responsable="bea@ejemplo.com" />,
    );
    expect(await problemasDeAccesibilidad(con.container)).toEqual([]);
    const sin = render(
      <DatosTarea tarea={{ ...tarea, vence: null }} responsable={null} />,
    );
    expect(await problemasDeAccesibilidad(sin.container)).toEqual([]);
  });
});

describe("axe · invitaciones y estados", () => {
  const vista = (estado: EstadoInvitacion): VistaInvitacion => ({
    proyectoId: "p1",
    nombreProyecto: "Tablero de clase",
    rol: "editor",
    estado,
  });

  it.each(["valida", "usada", "vencida", "miembro"] as const)(
    "TarjetaInvitacion en estado %s: sin violaciones",
    async (estado) => {
      const { container } = render(
        <TarjetaInvitacion vista={vista(estado)} codigo="abc" />,
      );
      expect(await problemasDeAccesibilidad(container)).toEqual([]);
    },
  );

  it("AvisoError y Esqueleto: sin violaciones", async () => {
    const error = render(
      <AvisoError error={new Error("x")} retry={() => {}} nivel="h1" />,
    );
    expect(await problemasDeAccesibilidad(error.container)).toEqual([]);
    const carga = render(<Esqueleto etiqueta="Cargando…" />);
    expect(await problemasDeAccesibilidad(carga.container)).toEqual([]);
  });
});
