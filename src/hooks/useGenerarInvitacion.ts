"use client";

import { type FormEvent, useState } from "react";
import { mensajeDeError, pedirApi } from "@/lib/api-cliente";
import {
  CrearInvitacionSchema,
  type Invitacion,
  RespuestaInvitacionSchema,
} from "@/schemas/invitacion";

export interface InvitacionGenerada {
  invitacion: Invitacion;
  /** Enlace completo para compartir. */
  enlace: string;
}

/** Valida con el mismo esquema Zod que la API y pide el código al servidor. */
export function useGenerarInvitacion(proyectoId: string) {
  const [generada, setGenerada] = useState<InvitacionGenerada | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function generar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const resultado = CrearInvitacionSchema.safeParse(datos);
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const ruta = `/api/proyectos/${proyectoId}/invitaciones`;
      const cuerpo = await pedirApi(ruta, {
        method: "POST",
        body: resultado.data,
      });
      const { invitacion } = RespuestaInvitacionSchema.parse(cuerpo);
      const enlace = `${window.location.origin}/invitacion/${invitacion.codigo}`;
      setGenerada({ invitacion, enlace });
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  return { generada, error, enviando, generar };
}
