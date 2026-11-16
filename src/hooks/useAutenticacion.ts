"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { z } from "zod";
import { mensajeDeErrorAuth } from "@/lib/mensajes-auth";
import { destinoSeguro } from "@/lib/navegacion";
import { iniciarSesion, type ModoAcceso } from "@/lib/sesion-cliente";
import { CredencialesSchema, RegistroSchema } from "@/schemas/sesion";

export type ErroresCampo = Partial<Record<"correo" | "contrasena", string>>;

function erroresPorCampo(error: z.ZodError): ErroresCampo {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "");
    errores[campo] ??= issue.message;
  }
  return errores;
}

/** Valida con el mismo esquema Zod que el servidor y crea la sesión. */
export function useAutenticacion(modo: ModoAcceso) {
  const router = useRouter();
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const esquema = modo === "login" ? CredencialesSchema : RegistroSchema;
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const resultado = esquema.safeParse(datos);
    if (!resultado.success) {
      setErrores(erroresPorCampo(resultado.error));
      setMensaje("Revisa los campos marcados.");
      return;
    }
    setErrores({});
    setMensaje("");
    setEnviando(true);
    try {
      await iniciarSesion(modo, resultado.data);
      const siguiente = new URLSearchParams(window.location.search);
      router.push(destinoSeguro(siguiente.get("siguiente")));
      router.refresh();
    } catch (error) {
      setMensaje(mensajeDeErrorAuth(error));
    } finally {
      setEnviando(false);
    }
  }

  return { errores, mensaje, enviando, enviar };
}
