import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Gestor de proyectos · Organiza el trabajo de tu equipo" },
  description:
    "Crea proyectos, reparte tareas con responsable y fecha, comenta y sigue la actividad de tu equipo de clase.",
};

export default function Inicio() {
  return (
    <section aria-labelledby="titulo-inicio">
      <h1 id="titulo-inicio">Gestor de proyectos</h1>
      <p>Organiza proyectos, tareas y comentarios con tu equipo.</p>
      <p>
        <Link href="/proyectos" className="boton">
          Ver mis proyectos
        </Link>
      </p>
    </section>
  );
}
