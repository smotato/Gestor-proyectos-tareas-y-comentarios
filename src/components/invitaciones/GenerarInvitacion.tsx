"use client";

import { CampoSelect } from "@/components/Campo";
import { useGenerarInvitacion } from "@/hooks/useGenerarInvitacion";
import { formatearFechaHora } from "@/lib/tareas-ui";

const ROLES_INVITABLES = [
  { valor: "lector", texto: "Lector (solo puede ver)" },
  { valor: "editor", texto: "Editor (crea y edita tareas)" },
];

/** Solo se muestra al propietario; la API vuelve a verificarlo (403 para los demás). */
export function GenerarInvitacion({ proyectoId }: { proyectoId: string }) {
  const { generada, error, enviando, generar } =
    useGenerarInvitacion(proyectoId);
  return (
    <section aria-labelledby="titulo-invitar" className="tarjeta-borde pila">
      <h3 id="titulo-invitar">Invitar a alguien</h3>
      <form className="formulario" onSubmit={generar} noValidate>
        <CampoSelect
          nombre="rol"
          etiqueta="Rol de la invitación"
          opciones={ROLES_INVITABLES}
          valorInicial="lector"
          error={error}
        />
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? "Generando…" : "Generar código"}
        </button>
      </form>
      {generada ? (
        <div role="status">
          <p>Invitación creada. Compártela con quien quieras invitar.</p>
          <dl className="tarea__datos">
            <dt>Código</dt>
            <dd>
              <code className="codigo">{generada.invitacion.codigo}</code>
            </dd>
            <dt>Enlace</dt>
            <dd>
              <code className="codigo">{generada.enlace}</code>
            </dd>
            <dt>Vence</dt>
            <dd>{formatearFechaHora(generada.invitacion.expira)}</dd>
          </dl>
        </div>
      ) : null}
    </section>
  );
}
