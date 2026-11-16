"use client";

import { useAutenticacion } from "@/hooks/useAutenticacion";
import type { ModoAcceso } from "@/lib/sesion-cliente";
import { Campo } from "./Campo";

const TEXTOS: Record<ModoAcceso, { boton: string; contrasena: string }> = {
  login: { boton: "Iniciar sesión", contrasena: "current-password" },
  registro: { boton: "Crear cuenta", contrasena: "new-password" },
};

export function FormularioCredenciales({ modo }: { modo: ModoAcceso }) {
  const { errores, mensaje, enviando, enviar } = useAutenticacion(modo);
  const textos = TEXTOS[modo];
  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <Campo
        nombre="correo"
        etiqueta="Correo electrónico"
        tipo="email"
        autoComplete="email"
        error={errores.correo}
      />
      <Campo
        nombre="contrasena"
        etiqueta="Contraseña"
        tipo="password"
        autoComplete={textos.contrasena}
        error={errores.contrasena}
      />
      <div role="alert" className="formulario__mensaje">
        {mensaje}
      </div>
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Enviando…" : textos.boton}
      </button>
    </form>
  );
}
