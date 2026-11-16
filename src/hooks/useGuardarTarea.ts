"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { mensajeDeError, pedirApi } from "@/lib/api-cliente";
import { datosDelFormulario, erroresPorCampo } from "@/lib/formulario-tarea";
import type { SolicitudDialogo } from "@/components/tareas/tipos";
import { ActualizarTareaSchema, CrearTareaSchema } from "@/schemas/tarea";

/**
 * Valida con el mismo esquema Zod que la API (crear o actualizar) y guarda.
 * `alGuardar` cierra el diálogo; después se refresca la lista del servidor.
 */
export function useGuardarTarea(
  proyectoId: string,
  solicitud: SolicitudDialogo,
  alGuardar: () => void,
) {
  const router = useRouter();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const tareaEditada = solicitud.modo === "editar" ? solicitud.tarea : null;
  const editando = tareaEditada !== null;

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const entrada = datosDelFormulario(formulario, editando);
    const esquema = editando ? ActualizarTareaSchema : CrearTareaSchema;
    const resultado = esquema.safeParse(entrada);
    if (!resultado.success) {
      setErrores(erroresPorCampo(resultado.error));
      setAviso("Revisa los campos marcados.");
      return;
    }
    setErrores({});
    setAviso("");
    setEnviando(true);
    try {
      const base = `/api/proyectos/${proyectoId}/tareas`;
      const ruta = tareaEditada ? `${base}/${tareaEditada.id}` : base;
      await pedirApi(ruta, {
        method: editando ? "PATCH" : "POST",
        body: resultado.data,
      });
      alGuardar();
      router.refresh();
    } catch (error) {
      setAviso(mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return { errores, aviso, enviando, guardar };
}
