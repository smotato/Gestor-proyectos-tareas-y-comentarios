"use client";

import { useCallback, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Dialogo } from "@/components/ui/Dialogo";
import { FormularioNuevoProyecto } from "./FormularioNuevoProyecto";

/** Botón que abre el formulario para crear un proyecto en un diálogo. */
export function BotonNuevoProyecto({ texto = "Nuevo proyecto" }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);
  return (
    <>
      <Boton onClick={() => setAbierto(true)}>{texto}</Boton>
      <Dialogo abierto={abierto} onCerrar={cerrar} titulo="Nuevo proyecto">
        <FormularioNuevoProyecto />
        <div className="acciones-formulario">
          <Boton variante="secundario" onClick={cerrar}>
            Cerrar
          </Boton>
        </div>
      </Dialogo>
    </>
  );
}
