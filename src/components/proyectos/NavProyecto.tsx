"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { EnlaceMenu } from "@/components/app/EnlaceMenu";
import {
  IconoMiembros,
  IconoTablero,
  IconoTareas,
} from "@/components/app/Iconos";

/**
 * Secciones del proyecto para el menú lateral: Tablero, Mis tareas y Miembros.
 * Marca la actual con aria-current="page". «Mis tareas» es el mismo tablero
 * con el filtro `?mias=1`.
 */
export function NavProyecto({ id }: { id: string }) {
  const ruta = usePathname();
  const mias = useSearchParams().get("mias") === "1";
  const base = `/proyectos/${id}`;
  const enTablero = ruta === base || ruta.startsWith(`${base}/tareas/`);
  const enlaces = [
    {
      href: base,
      texto: "Tablero",
      icono: <IconoTablero />,
      activo: enTablero && !mias,
    },
    {
      href: `${base}?mias=1`,
      texto: "Mis tareas",
      icono: <IconoTareas />,
      activo: ruta === base && mias,
    },
    {
      href: `${base}/miembros`,
      texto: "Miembros",
      icono: <IconoMiembros />,
      activo: ruta === `${base}/miembros`,
    },
  ];
  return (
    <>
      <p id="titulo-nav-proyecto" className="nav-lateral__titulo">
        Proyecto
      </p>
      <ul className="nav-lateral__lista" aria-labelledby="titulo-nav-proyecto">
        {enlaces.map((enlace) => (
          <li key={enlace.href}>
            <EnlaceMenu {...enlace} />
          </li>
        ))}
      </ul>
    </>
  );
}
