import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { Esqueleto } from "@/components/Esqueleto";
import { NavProyecto } from "@/components/proyectos/NavProyecto";
import { proyectoDelUsuario } from "@/lib/proyectos-servidor";
import { ETIQUETA_ROL } from "@/lib/roles";

interface PropsLayout {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

/** Encabezado del proyecto: verifica que el usuario sea miembro (si no, 404). */
async function EncabezadoProyecto({ params }: Pick<PropsLayout, "params">) {
  const { id } = await params;
  const { proyecto, rol } = await proyectoDelUsuario(id);
  return (
    <>
      <h1>{proyecto.nombre}</h1>
      <p className="texto-tenue">Tu rol: {ETIQUETA_ROL[rol]}</p>
      <NavProyecto id={id} />
    </>
  );
}

/** Layout compartido de /proyectos/[id] y sus subrutas. */
export default function LayoutProyecto({ children, params }: PropsLayout) {
  return (
    <div className="pila">
      <p>
        <Link href="/proyectos">← Mis proyectos</Link>
      </p>
      <div className="encabezado-proyecto">
        <Suspense
          fallback={<Esqueleto etiqueta="Cargando el proyecto…" lineas={2} />}
        >
          <EncabezadoProyecto params={params} />
        </Suspense>
      </div>
      {children}
    </div>
  );
}
