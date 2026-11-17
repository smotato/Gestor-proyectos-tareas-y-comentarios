import { proyectoDelUsuario } from "@/lib/proyectos-servidor";
import { puede } from "@/services/permisos";
import { GenerarInvitacion } from "./GenerarInvitacion";

/** Solo el propietario ve la sección para invitar. Va dentro de un <Suspense>. */
export async function SeccionInvitar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { rol } = await proyectoDelUsuario(id);
  return puede(rol, "invitar") ? <GenerarInvitacion proyectoId={id} /> : null;
}
