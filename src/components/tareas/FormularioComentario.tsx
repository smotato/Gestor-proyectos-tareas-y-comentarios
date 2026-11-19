"use client";

import { CampoAreaTexto } from "@/components/Campo";
import { useComentar } from "@/hooks/useComentar";

interface PropsComentario {
  proyectoId: string;
  tareaId: string;
}

/** Solo se muestra a quien puede comentar; la API vuelve a verificarlo. */
export function FormularioComentario({ proyectoId, tareaId }: PropsComentario) {
  const { error, aviso, enviando, comentar } = useComentar(proyectoId, tareaId);
  return (
    <form className="formulario" onSubmit={comentar} noValidate>
      <CampoAreaTexto
        nombre="texto"
        etiqueta="Escribe un comentario"
        error={error}
      />
      <p role="status" className="formulario__aviso">
        {aviso}
      </p>
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Publicando…" : "Publicar comentario"}
      </button>
    </form>
  );
}
