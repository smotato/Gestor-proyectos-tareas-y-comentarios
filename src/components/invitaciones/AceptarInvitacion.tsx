"use client";

import { useAceptarInvitacion } from "@/hooks/useAceptarInvitacion";

export function AceptarInvitacion({ codigo }: { codigo: string }) {
  const { error, enviando, aceptar } = useAceptarInvitacion(codigo);
  return (
    <div className="pila">
      <p role="alert" className="formulario__mensaje">
        {error}
      </p>
      <button
        type="button"
        className="boton"
        disabled={enviando}
        onClick={aceptar}
      >
        {enviando ? "Uniéndote…" : "Aceptar invitación"}
      </button>
    </div>
  );
}
