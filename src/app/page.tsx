import Link from "next/link";

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
