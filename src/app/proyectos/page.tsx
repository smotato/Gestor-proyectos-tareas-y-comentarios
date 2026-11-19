import type { Metadata } from "next";
import { Suspense } from "react";
import { Esqueleto } from "@/components/Esqueleto";
import { BotonNuevoProyecto } from "@/components/proyectos/BotonNuevoProyecto";
import { ListaProyectos } from "@/components/proyectos/ListaProyectos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { SIN_INDEXAR } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mis proyectos",
  robots: SIN_INDEXAR,
};

/**
 * La lista verifica la sesión en el servidor (el proxy solo redirige si falta
 * la cookie). Si falla la carga, `error.tsx` muestra el error y "Reintentar".
 */
export default function PaginaProyectos() {
  return (
    <div className="pila">
      <EncabezadoPagina
        titulo="Mis proyectos"
        descripcion="Los proyectos en los que participas con tu equipo."
        accion={<BotonNuevoProyecto />}
      />
      <section aria-labelledby="titulo-lista">
        <h2 id="titulo-lista">Tus proyectos</h2>
        <Suspense fallback={<Esqueleto etiqueta="Cargando tus proyectos…" />}>
          <ListaProyectos />
        </Suspense>
      </section>
    </div>
  );
}
