import type { Metadata } from "next";
import { Suspense } from "react";
import { Esqueleto } from "@/components/Esqueleto";
import { ListaMiembros } from "@/components/proyectos/ListaMiembros";

export const metadata: Metadata = { title: "Miembros del proyecto" };

export default function PaginaMiembros({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <section aria-labelledby="titulo-miembros">
      <h2 id="titulo-miembros">Miembros</h2>
      <Suspense fallback={<Esqueleto etiqueta="Cargando los miembros…" />}>
        <ListaMiembros params={params} />
      </Suspense>
    </section>
  );
}
