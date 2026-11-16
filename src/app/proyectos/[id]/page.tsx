import type { Metadata } from "next";
import { Suspense } from "react";
import { Esqueleto } from "@/components/Esqueleto";
import { PanelTareas } from "@/components/tareas/PanelTareas";

export const metadata: Metadata = { title: "Tareas del proyecto" };

interface PropsPagina {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Tablero y lista de tareas: `?estado=`, `?responsable=` y `?mias=1` en la URL. */
export default function PaginaTareas({ params, searchParams }: PropsPagina) {
  return (
    <section aria-labelledby="titulo-tareas">
      <h2 id="titulo-tareas">Tareas</h2>
      <Suspense fallback={<Esqueleto etiqueta="Cargando las tareas…" />}>
        <PanelTareas params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
