import type { Metadata } from "next";
import { SIN_INDEXAR } from "@/lib/seo";
import { Suspense } from "react";
import { Esqueleto } from "@/components/Esqueleto";
import { PanelInvitacion } from "@/components/invitaciones/PanelInvitacion";

export const metadata: Metadata = {
  title: "Invitación a un proyecto",
  robots: SIN_INDEXAR,
};

interface PropsPagina {
  params: Promise<{ codigo: string }>;
}

/** Aceptar una invitación: `/invitacion/<código>`. */
export default function PaginaInvitacion({ params }: PropsPagina) {
  return (
    <section className="tarjeta" aria-labelledby="titulo-invitacion">
      <h1 id="titulo-invitacion">Invitación a un proyecto</h1>
      <Suspense fallback={<Esqueleto etiqueta="Comprobando la invitación…" />}>
        <PanelInvitacion params={params} />
      </Suspense>
    </section>
  );
}
