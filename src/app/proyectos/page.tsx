import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { usuarioActual } from "@/lib/auth-servidor";

export const metadata: Metadata = { title: "Mis proyectos" };

/** Verificación real de la sesión (el proxy solo redirige si falta la cookie). */
async function DatosSesion() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login?siguiente=/proyectos");
  return (
    <p>
      Sesión iniciada como <strong>{usuario.correo ?? usuario.uid}</strong>. La
      lista de proyectos llega con RF-01.
    </p>
  );
}

function EsqueletoSesion() {
  return (
    <div className="esqueleto" role="status" aria-live="polite">
      <span className="sr-only">Comprobando tu sesión…</span>
      <div className="esqueleto__linea esqueleto__linea--corta" />
    </div>
  );
}

export default function PaginaProyectos() {
  return (
    <section aria-labelledby="titulo-proyectos">
      <h1 id="titulo-proyectos">Mis proyectos</h1>
      <Suspense fallback={<EsqueletoSesion />}>
        <DatosSesion />
      </Suspense>
    </section>
  );
}
