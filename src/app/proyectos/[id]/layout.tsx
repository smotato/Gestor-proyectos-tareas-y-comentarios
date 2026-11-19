import { type ReactNode, Suspense } from "react";
import { Esqueleto } from "@/components/Esqueleto";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
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
    <EncabezadoPagina
      titulo={proyecto.nombre}
      descripcion={`Tu rol: ${ETIQUETA_ROL[rol]}`}
    />
  );
}

/**
 * Layout compartido de /proyectos/[id] y sus subrutas. Las secciones del
 * proyecto (Tablero, Mis tareas, Miembros) están en el menú lateral.
 */
export default function LayoutProyecto({ children, params }: PropsLayout) {
  return (
    <div className="pila">
      <Suspense
        fallback={<Esqueleto etiqueta="Cargando el proyecto…" lineas={2} />}
      >
        <EncabezadoProyecto params={params} />
      </Suspense>
      {children}
    </div>
  );
}
