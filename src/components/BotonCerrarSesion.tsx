"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensajeDeErrorAuth } from "@/lib/mensajes-auth";
import { cerrarSesion } from "@/lib/sesion-cliente";

export function BotonCerrarSesion() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function salir() {
    setError("");
    try {
      await cerrarSesion();
      router.push("/login");
      router.refresh();
    } catch (e) {
      setError(mensajeDeErrorAuth(e));
    }
  }

  return (
    <>
      <button type="button" className="boton boton--secundario" onClick={salir}>
        Cerrar sesión
      </button>
      <span role="alert" className="sr-only">
        {error}
      </span>
    </>
  );
}
