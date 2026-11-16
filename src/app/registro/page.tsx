import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCredenciales } from "@/components/FormularioCredenciales";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function PaginaRegistro() {
  return (
    <section className="tarjeta" aria-labelledby="titulo-registro">
      <h1 id="titulo-registro">Crear cuenta</h1>
      <p className="texto-tenue">
        La contraseña debe tener al menos 8 caracteres.
      </p>
      <FormularioCredenciales modo="registro" />
      <p>
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </section>
  );
}
