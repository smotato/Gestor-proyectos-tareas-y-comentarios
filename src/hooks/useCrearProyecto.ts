"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { mensajeDeError, pedirApi } from "@/lib/api-cliente";
import { CrearProyectoSchema } from "@/schemas/proyecto";

/** Valida con el mismo esquema Zod que la API y crea el proyecto. */
export function useCrearProyecto() {
  const router = useRouter();
  const [errorCampo, setErrorCampo] = useState<string>();
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario));
    const resultado = CrearProyectoSchema.safeParse(datos);
    if (!resultado.success) {
      setErrorCampo(resultado.error.issues[0]?.message);
      return;
    }
    setErrorCampo(undefined);
    setAviso("");
    setEnviando(true);
    try {
      await pedirApi("/api/proyectos", {
        method: "POST",
        body: resultado.data,
      });
      formulario.reset();
      setAviso(`Proyecto «${resultado.data.nombre}» creado.`);
      router.refresh();
    } catch (error) {
      setAviso(mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return { errorCampo, aviso, enviando, crear };
}
