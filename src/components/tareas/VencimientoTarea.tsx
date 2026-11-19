import { IconoAlerta } from "@/components/app/Iconos";
import { Insignia } from "@/components/ui/Insignia";
import { estaVencida, formatearFecha } from "@/lib/tareas-ui";
import type { Tarea } from "@/schemas/tarea";

/** Insignia «Vencida» (texto + icono) si el día ya pasó y la tarea sigue abierta. */
export function InsigniaVencida({ tarea, hoy }: { tarea: Tarea; hoy: string }) {
  if (!estaVencida(tarea.vence, tarea.estado, hoy)) return null;
  return (
    <Insignia tono="error" icono={<IconoAlerta />}>
      Vencida
    </Insignia>
  );
}

/** Fecha de vencimiento, o «Sin fecha». */
export function FechaVence({ vence }: { vence: string | null }) {
  if (!vence) return <>Sin fecha</>;
  return <time dateTime={vence}>{formatearFecha(vence)}</time>;
}
