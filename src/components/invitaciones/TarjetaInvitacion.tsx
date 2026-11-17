import Link from "next/link";
import { ETIQUETA_ROL } from "@/lib/roles";
import type { VistaInvitacion } from "@/services/invitaciones";
import { AceptarInvitacion } from "./AceptarInvitacion";

const MENSAJES: Readonly<Record<"usada" | "vencida", string>> = {
  usada: "Esta invitación ya fue usada. Pide una nueva al propietario.",
  vencida: "Esta invitación venció. Pide una nueva al propietario.",
};

function Estado({ vista, codigo }: { vista: VistaInvitacion; codigo: string }) {
  if (vista.estado === "valida") return <AceptarInvitacion codigo={codigo} />;
  if (vista.estado === "miembro") {
    return (
      <p>
        Ya eres miembro de este proyecto.{" "}
        <Link href={`/proyectos/${vista.proyectoId}`}>Ir al proyecto</Link>
      </p>
    );
  }
  return <p className="vacio">{MENSAJES[vista.estado]}</p>;
}

/** Qué se puede hacer con la invitación según su estado. */
export function TarjetaInvitacion(props: {
  vista: VistaInvitacion;
  codigo: string;
}) {
  const { vista } = props;
  return (
    <div className="pila">
      <p>
        Te invitaron al proyecto <strong>{vista.nombreProyecto}</strong> con el
        rol de <strong>{ETIQUETA_ROL[vista.rol]}</strong>.
      </p>
      <Estado vista={vista} codigo={props.codigo} />
    </div>
  );
}
