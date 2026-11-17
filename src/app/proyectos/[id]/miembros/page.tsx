import type { Metadata } from "next";
import { SIN_INDEXAR } from "@/lib/seo";
import { Suspense } from "react";
import { Esqueleto } from "@/components/Esqueleto";
import { SeccionInvitar } from "@/components/invitaciones/SeccionInvitar";
import { ListaMiembros } from "@/components/proyectos/ListaMiembros";

export const metadata: Metadata = {
  title: "Miembros del proyecto",
  robots: SIN_INDEXAR,
};

export default function PaginaMiembros({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="pila">
      <section aria-labelledby="titulo-miembros">
        <h2 id="titulo-miembros">Miembros</h2>
        <Suspense fallback={<Esqueleto etiqueta="Cargando los miembros…" />}>
          <ListaMiembros params={params} />
        </Suspense>
      </section>
      <Suspense fallback={null}>
        <SeccionInvitar params={params} />
      </Suspense>
    </div>
  );
}
