"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { mensajeDeError, pedirApi } from "@/lib/api-cliente";
import { ETIQUETA_ROL } from "@/lib/roles";
import { type Rol, RolSchema } from "@/schemas/rol";

interface PropsAcciones {
  proyectoId: string;
  uid: string;
  nombre: string;
  rol: Rol;
  /** Roles a los que se puede pasar sin dejar el proyecto sin propietario. */
  rolesPermitidos: readonly Rol[];
  puedeQuitar: boolean;
}

function rutaMiembro(proyectoId: string, uid: string): string {
  return `/api/proyectos/${proyectoId}/miembros/${encodeURIComponent(uid)}`;
}

/** Acciones contra la API: anuncia el resultado y refresca la página. */
function useAccionesMiembro(ruta: string, nombre: string) {
  const router = useRouter();
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function ejecutar(accion: () => Promise<unknown>, exito: string) {
    setOcupado(true);
    setAviso("");
    try {
      await accion();
      setAviso(exito);
      router.refresh();
    } catch (error) {
      setAviso(mensajeDeError(error));
    } finally {
      setOcupado(false);
    }
  }

  function cambiarRol(rol: Rol) {
    void ejecutar(
      () => pedirApi(ruta, { method: "PATCH", body: { rol } }),
      "Rol actualizado.",
    );
  }

  function quitar() {
    if (!window.confirm(`¿Quitar a ${nombre} del proyecto?`)) return;
    void ejecutar(
      () => pedirApi(ruta, { method: "DELETE" }),
      "Miembro quitado.",
    );
  }

  return { aviso, ocupado, cambiarRol, quitar };
}

interface PropsSelector {
  id: string;
  nombre: string;
  rolActual: Rol;
  roles: readonly Rol[];
  ocupado: boolean;
  onGuardar: (rol: Rol) => void;
}

function SelectorRol(props: PropsSelector) {
  const [rol, setRol] = useState<Rol>(props.rolActual);
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    props.onGuardar(rol);
  }
  return (
    <form className="acciones-miembro__rol" onSubmit={enviar}>
      <label htmlFor={props.id}>Rol de {props.nombre}</label>
      <select
        id={props.id}
        value={rol}
        onChange={(e) => setRol(RolSchema.parse(e.target.value))}
      >
        {props.roles.map((opcion) => (
          <option key={opcion} value={opcion}>
            {ETIQUETA_ROL[opcion]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="boton boton--secundario"
        disabled={props.ocupado || rol === props.rolActual}
      >
        Guardar rol
      </button>
    </form>
  );
}

/**
 * Acciones del propietario sobre un miembro. Solo se muestran las permitidas;
 * la API vuelve a verificarlo todo.
 */
export function AccionesMiembro(props: PropsAcciones) {
  const { aviso, ocupado, cambiarRol, quitar } = useAccionesMiembro(
    rutaMiembro(props.proyectoId, props.uid),
    props.nombre,
  );

  return (
    <div className="acciones-miembro">
      {props.rolesPermitidos.length > 1 ? (
        <SelectorRol
          id={`rol-${props.uid}`}
          nombre={props.nombre}
          rolActual={props.rol}
          roles={props.rolesPermitidos}
          ocupado={ocupado}
          onGuardar={cambiarRol}
        />
      ) : (
        <p className="texto-tenue">
          Único propietario: su rol no se puede cambiar.
        </p>
      )}
      {props.puedeQuitar ? (
        <button
          type="button"
          className="boton boton--peligro"
          disabled={ocupado}
          onClick={quitar}
        >
          Quitar del proyecto
        </button>
      ) : null}
      <p role="status" className="acciones-miembro__aviso">
        {aviso}
      </p>
    </div>
  );
}
