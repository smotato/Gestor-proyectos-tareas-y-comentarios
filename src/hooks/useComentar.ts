"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { mensajeDeError, pedirApi } from "@/lib/api-cliente";
import { CrearComentarioSchema } from "@/schemas/comentario";

/** Valida con el mismo esquema Zod que la API y publica el comentario. */
export function useComentar(proyectoId: string, tareaId: string) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function comentar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario));
    const resultado = CrearComentarioSchema.safeParse(datos);
    setAviso("");
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setEnviando(true);
    try {
      const ruta = `/api/proyectos/${proyectoId}/tareas/${tareaId}/comentarios`;
      await pedirApi(ruta, { method: "POST", body: resultado.data });
      formulario.reset();
      setAviso("Comentario publicado.");
      router.refresh();
    } catch (causa) {
      setAviso(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  return { error, aviso, enviando, comentar };
}
