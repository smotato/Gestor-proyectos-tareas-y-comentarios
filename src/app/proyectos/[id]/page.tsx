import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tareas del proyecto" };

/** Pestaña de tareas: el tablero llega con la interfaz de RF-03. */
export default function PaginaTareas() {
  return (
    <section aria-labelledby="titulo-tareas">
      <h2 id="titulo-tareas">Tareas</h2>
      <p className="vacio">
        Todavía no hay tablero de tareas en la interfaz. Llega en la siguiente
        iteración.
      </p>
    </section>
  );
}
