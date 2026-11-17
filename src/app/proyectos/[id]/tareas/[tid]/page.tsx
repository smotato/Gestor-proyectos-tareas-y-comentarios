import type { Metadata } from "next";
import { SIN_INDEXAR } from "@/lib/seo";
import { Suspense } from "react";
import { Esqueleto } from "@/components/Esqueleto";
import { DetalleTarea } from "@/components/tareas/DetalleTarea";

export const metadata: Metadata = {
  title: "Detalle de la tarea",
  robots: SIN_INDEXAR,
};

interface PropsPagina {
  params: Promise<{ id: string; tid: string }>;
}

/** Detalle de una tarea con sus comentarios y el formulario para comentar. */
export default function PaginaDetalleTarea({ params }: PropsPagina) {
  return (
    <Suspense fallback={<Esqueleto etiqueta="Cargando la tarea…" />}>
      <DetalleTarea params={params} />
    </Suspense>
  );
}
