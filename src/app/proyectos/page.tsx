import type { Metadata } from "next";
import { Suspense } from "react";
import { Esqueleto } from "@/components/Esqueleto";
import { FormularioNuevoProyecto } from "@/components/proyectos/FormularioNuevoProyecto";
import { ListaProyectos } from "@/components/proyectos/ListaProyectos";

export const metadata: Metadata = { title: "Mis proyectos" };

/**
 * La lista verifica la sesión en el servidor (el proxy solo redirige si falta
 * la cookie). Si falla la carga, `error.tsx` muestra el error y "Reintentar".
 */
export default function PaginaProyectos() {
  return (
    <div className="pila">
      <h1>Mis proyectos</h1>
      <section aria-labelledby="titulo-crear" className="tarjeta-borde">
        <h2 id="titulo-crear">Crear proyecto</h2>
        <FormularioNuevoProyecto />
      </section>
      <section aria-labelledby="titulo-lista">
        <h2 id="titulo-lista">Tus proyectos</h2>
        <Suspense fallback={<Esqueleto etiqueta="Cargando tus proyectos…" />}>
          <ListaProyectos />
        </Suspense>
      </section>
    </div>
  );
}
