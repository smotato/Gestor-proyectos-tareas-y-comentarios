import type { Metadata } from "next";
import { SIN_INDEXAR } from "@/lib/seo";
import { Suspense } from "react";
import { PanelActividad } from "@/components/actividad/PanelActividad";
import { Esqueleto } from "@/components/Esqueleto";
import { PanelTareas } from "@/components/tareas/PanelTareas";

export const metadata: Metadata = {
  title: "Tareas del proyecto",
  robots: SIN_INDEXAR,
};

interface PropsPagina {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Tablero de tareas (filtros en la URL) y registro de actividad del proyecto. */
export default function PaginaTareas({ params, searchParams }: PropsPagina) {
  return (
    <div className="pila">
      <section aria-labelledby="titulo-tareas">
        <h2 id="titulo-tareas">Tareas</h2>
        <Suspense fallback={<Esqueleto etiqueta="Cargando las tareas…" />}>
          <PanelTareas params={params} searchParams={searchParams} />
        </Suspense>
      </section>
      <section aria-labelledby="titulo-actividad">
        <h2 id="titulo-actividad">Actividad</h2>
        <Suspense fallback={<Esqueleto etiqueta="Cargando la actividad…" />}>
          <PanelActividad params={params} />
        </Suspense>
      </section>
    </div>
  );
}
