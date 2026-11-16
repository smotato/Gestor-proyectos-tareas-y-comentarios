"use client";

import { useRouter } from "next/navigation";
import { startTransition, useOptimistic, useState } from "react";
import { mensajeDeError, pedirApi } from "@/lib/api-cliente";
import type { EstadoTarea, Tarea } from "@/schemas/tarea";

interface CambioEstado {
  id: string;
  estado: EstadoTarea;
}

function aplicar(tareas: Tarea[], cambio: CambioEstado): Tarea[] {
  return tareas.map((tarea) =>
    tarea.id === cambio.id ? { ...tarea, estado: cambio.estado } : tarea,
  );
}

/**
 * Cambia el estado al instante con `useOptimistic` y lo confirma con la API.
 * Si la API falla, la tarea vuelve a su columna y se muestra el error.
 */
export function useCambioEstado(proyectoId: string, tareas: Tarea[]) {
  const router = useRouter();
  const [visibles, cambiarVisible] = useOptimistic(tareas, aplicar);
  const [error, setError] = useState("");

  function cambiarEstado(tarea: Tarea, estado: EstadoTarea) {
    if (estado === tarea.estado) return;
    setError("");
    startTransition(async () => {
      cambiarVisible({ id: tarea.id, estado });
      try {
        const ruta = `/api/proyectos/${proyectoId}/tareas/${tarea.id}`;
        await pedirApi(ruta, { method: "PATCH", body: { estado } });
        router.refresh();
      } catch (causa) {
        setError(mensajeDeError(causa));
      }
    });
  }

  return { visibles, error, cambiarEstado };
}
