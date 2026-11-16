import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCredenciales } from "@/components/FormularioCredenciales";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function PaginaLogin() {
  return (
    <section className="tarjeta" aria-labelledby="titulo-login">
      <h1 id="titulo-login">Iniciar sesión</h1>
      <FormularioCredenciales modo="login" />
      <p>
        ¿No tienes cuenta? <Link href="/registro">Crea una</Link>
      </p>
    </section>
  );
}
