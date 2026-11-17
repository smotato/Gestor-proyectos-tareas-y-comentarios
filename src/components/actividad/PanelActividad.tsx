import {
  miembrosDelProyecto,
  proyectoDelUsuario,
} from "@/lib/proyectos-servidor";
import { listarActividad } from "@/services/gestion-actividad";
import { ListaActividad } from "./ListaActividad";

const LIMITE_ACTIVIDAD = 20;

/**
 * Server Component: lee los últimos registros del proyecto (la API pagina con
 * `cursor`). Va dentro de un <Suspense>; se actualiza con `router.refresh()`.
 */
export async function PanelActividad({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { usuario, proyecto } = await proyectoDelUsuario(id);
  const [pagina, miembros] = await Promise.all([
    listarActividad(proyecto, usuario.uid, { limite: LIMITE_ACTIVIDAD }),
    miembrosDelProyecto(id),
  ]);
  const nombres = new Map(miembros.map((m) => [m.uid, m.correo ?? m.uid]));
  return (
    <ListaActividad
      items={pagina.items}
      nombres={nombres}
      hayMas={pagina.siguienteCursor !== null}
    />
  );
}
