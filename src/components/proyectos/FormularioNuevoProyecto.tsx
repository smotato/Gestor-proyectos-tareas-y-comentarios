"use client";

import { useCrearProyecto } from "@/hooks/useCrearProyecto";
import { Campo } from "../Campo";

export function FormularioNuevoProyecto() {
  const { errorCampo, aviso, enviando, crear } = useCrearProyecto();
  return (
    <form className="formulario" onSubmit={crear} noValidate>
      <Campo
        nombre="nombre"
        etiqueta="Nombre del proyecto"
        tipo="text"
        autoComplete="off"
        error={errorCampo}
      />
      <p role="status" className="formulario__aviso">
        {aviso}
      </p>
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Creando…" : "Crear proyecto"}
      </button>
    </form>
  );
}
