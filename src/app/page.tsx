import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Gestor de proyectos</h1>
      <p>Organiza proyectos, tareas y comentarios con tu equipo.</p>
      <Link href="/proyectos">Ver mis proyectos</Link>
    </main>
  );
}
