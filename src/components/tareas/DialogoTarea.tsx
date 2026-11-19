"use client";

import { useDialogo } from "@/hooks/useDialogo";
import { useGuardarTarea } from "@/hooks/useGuardarTarea";
import { CamposTarea } from "./CamposTarea";
import type { OpcionMiembro, SolicitudDialogo } from "./tipos";

interface PropsFormulario {
  proyectoId: string;
  miembros: readonly OpcionMiembro[];
  solicitud: SolicitudDialogo;
  onCerrar: () => void;
}

function FormularioTarea({
  proyectoId,
  miembros,
  solicitud,
  onCerrar,
}: PropsFormulario) {
  const { errores, aviso, enviando, guardar } = useGuardarTarea(
    proyectoId,
    solicitud,
    onCerrar,
  );
  const tarea = solicitud.modo === "editar" ? solicitud.tarea : null;
  const textoGuardar = tarea ? "Guardar cambios" : "Crear tarea";
  return (
    <form className="formulario" onSubmit={guardar} noValidate>
      <CamposTarea tarea={tarea} miembros={miembros} errores={errores} />
      <p role="alert" className="formulario__mensaje">
        {aviso}
      </p>
      <div className="acciones-formulario">
        <button
          type="button"
          className="boton boton--secundario"
          onClick={onCerrar}
        >
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? "Guardando…" : textoGuardar}
        </button>
      </div>
    </form>
  );
}

interface PropsDialogo {
  proyectoId: string;
  miembros: readonly OpcionMiembro[];
  /** `null` = cerrado. */
  solicitud: SolicitudDialogo | null;
  onCerrar: () => void;
}

/**
 * Diálogo modal nativo para crear o editar una tarea. El formulario solo existe
 * mientras está abierto, así cada apertura empieza con los datos correctos.
 */
export function DialogoTarea({ solicitud, onCerrar, ...resto }: PropsDialogo) {
  const ref = useDialogo(solicitud !== null, onCerrar);
  const titulo = solicitud?.modo === "editar" ? "Editar tarea" : "Nueva tarea";
  return (
    <dialog ref={ref} className="dialogo" aria-labelledby="titulo-dialogo">
      {solicitud ? (
        <>
          <h2 id="titulo-dialogo">{titulo}</h2>
          <FormularioTarea
            solicitud={solicitud}
            onCerrar={onCerrar}
            {...resto}
          />
        </>
      ) : null}
    </dialog>
  );
}
