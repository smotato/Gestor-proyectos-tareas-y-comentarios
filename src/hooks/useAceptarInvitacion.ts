"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensajeDeError, pedirApi } from "@/lib/api-cliente";
import { RespuestaAceptarSchema } from "@/schemas/invitacion";

/** Acepta la invitación con la sesión actual y lleva al proyecto. */
export function useAceptarInvitacion(codigo: string) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aceptar() {
    setError("");
    setEnviando(true);
    try {
      const ruta = `/api/invitaciones/${encodeURIComponent(codigo)}/aceptar`;
      const cuerpo = await pedirApi(ruta, { method: "POST" });
      const { proyectoId } = RespuestaAceptarSchema.parse(cuerpo);
      router.push(`/proyectos/${proyectoId}`);
      router.refresh();
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  return { error, enviando, aceptar };
}
