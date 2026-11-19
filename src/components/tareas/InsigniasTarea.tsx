import { IconoPrioridad } from "@/components/app/Iconos";
import { Insignia, type TonoInsignia } from "@/components/ui/Insignia";
import { ETIQUETA_ESTADO, ETIQUETA_PRIORIDAD } from "@/lib/tareas-ui";
import type { EstadoTarea, Prioridad } from "@/schemas/tarea";

const TONO_PRIORIDAD: Readonly<Record<Prioridad, TonoInsignia>> = {
  alta: "error",
  media: "aviso",
  baja: "neutra",
};

const TONO_ESTADO: Readonly<Record<EstadoTarea, TonoInsignia>> = {
  pendiente: "neutra",
  enProgreso: "info",
  hecha: "exito",
};

/** Prioridad con texto e icono (flecha), no solo con color. */
export function InsigniaPrioridad({ prioridad }: { prioridad: Prioridad }) {
  return (
    <Insignia
      tono={TONO_PRIORIDAD[prioridad]}
      icono={<IconoPrioridad nivel={prioridad} />}
    >
      {`Prioridad ${ETIQUETA_PRIORIDAD[prioridad].toLowerCase()}`}
    </Insignia>
  );
}

export function InsigniaEstado({ estado }: { estado: EstadoTarea }) {
  return (
    <Insignia tono={TONO_ESTADO[estado]}>{ETIQUETA_ESTADO[estado]}</Insignia>
  );
}
