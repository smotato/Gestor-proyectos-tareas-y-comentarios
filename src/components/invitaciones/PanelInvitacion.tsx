import { notFound, redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth-servidor";
import { ErrorHttp } from "@/lib/errores";
import { describirInvitacion } from "@/services/invitaciones";
import { TarjetaInvitacion } from "./TarjetaInvitacion";

/** Carga la invitación; un código que no existe es un 404 de Next. */
async function cargarInvitacion(uid: string, codigo: string) {
  try {
    return await describirInvitacion(uid, codigo);
  } catch (error) {
    if (error instanceof ErrorHttp && error.status === 404) notFound();
    throw error;
  }
}

/**
 * Server Component: verifica la sesión (si falta, manda a iniciar sesión y
 * vuelve aquí) y muestra la invitación. Va dentro de un <Suspense>.
 */
export async function PanelInvitacion({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const usuario = await usuarioActual();
  if (!usuario) {
    const destino = encodeURIComponent(`/invitacion/${codigo}`);
    redirect(`/login?siguiente=${destino}`);
  }
  const vista = await cargarInvitacion(usuario.uid, codigo);
  return <TarjetaInvitacion vista={vista} codigo={codigo} />;
}
