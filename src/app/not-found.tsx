import Link from "next/link";

export default function NoEncontrado() {
  return (
    <section className="tarjeta" aria-labelledby="titulo-no-encontrado">
      <title>Página no encontrada · Gestor de proyectos</title>
      <h1 id="titulo-no-encontrado">Página no encontrada</h1>
      <p>La página que buscas no existe o no tienes acceso a ella.</p>
      <p>
        <Link href="/" className="enlace-discreto">
          Volver al inicio
        </Link>
      </p>
    </section>
  );
}
