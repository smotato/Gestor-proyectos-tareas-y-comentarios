"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Pestañas del proyecto; marca la actual con aria-current="page". */
export function NavProyecto({ id }: { id: string }) {
  const ruta = usePathname();
  const enlaces = [
    { href: `/proyectos/${id}`, texto: "Tareas" },
    { href: `/proyectos/${id}/miembros`, texto: "Miembros" },
  ];
  return (
    <nav aria-label="Secciones del proyecto">
      <ul className="pestanas">
        {enlaces.map(({ href, texto }) => (
          <li key={href}>
            <Link href={href} aria-current={ruta === href ? "page" : undefined}>
              {texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
