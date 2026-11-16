import { Campo, CampoAreaTexto, CampoSelect } from "@/components/Campo";
import { ETIQUETA_ESTADO, ETIQUETA_PRIORIDAD } from "@/lib/tareas-ui";
import { ESTADOS_TAREA, PRIORIDADES, type Tarea } from "@/schemas/tarea";
import type { OpcionMiembro } from "./tipos";

interface PropsCampos {
  /** Tarea que se edita; `null` al crear una nueva. */
  tarea: Tarea | null;
  miembros: readonly OpcionMiembro[];
  errores: Record<string, string>;
}

const PRIORIDAD_OPCIONES = PRIORIDADES.map((valor) => ({
  valor,
  texto: ETIQUETA_PRIORIDAD[valor],
}));

const ESTADO_OPCIONES = ESTADOS_TAREA.map((valor) => ({
  valor,
  texto: ETIQUETA_ESTADO[valor],
}));

function CamposPrincipales({ tarea, errores }: PropsCampos) {
  return (
    <>
      <Campo
        nombre="titulo"
        etiqueta="Título"
        tipo="text"
        autoComplete="off"
        valorInicial={tarea?.titulo}
        error={errores.titulo}
      />
      <CampoAreaTexto
        nombre="descripcion"
        etiqueta="Descripción"
        valorInicial={tarea?.descripcion}
        error={errores.descripcion}
      />
    </>
  );
}

function CamposDetalle({ tarea, miembros, errores }: PropsCampos) {
  const responsables = [
    { valor: "", texto: "Sin responsable" },
    ...miembros.map((m) => ({ valor: m.uid, texto: m.nombre })),
  ];
  return (
    <>
      <CampoSelect
        nombre="prioridad"
        etiqueta="Prioridad"
        opciones={PRIORIDAD_OPCIONES}
        valorInicial={tarea?.prioridad ?? "media"}
        error={errores.prioridad}
      />
      {tarea ? (
        <CampoSelect
          nombre="estado"
          etiqueta="Estado"
          opciones={ESTADO_OPCIONES}
          valorInicial={tarea.estado}
          error={errores.estado}
        />
      ) : null}
      <CampoSelect
        nombre="responsableUid"
        etiqueta="Responsable"
        opciones={responsables}
        valorInicial={tarea?.responsableUid ?? ""}
        error={errores.responsableUid}
      />
      <Campo
        nombre="vence"
        etiqueta="Fecha de vencimiento"
        tipo="date"
        requerido={false}
        valorInicial={tarea?.vence ?? ""}
        error={errores.vence}
      />
    </>
  );
}

export function CamposTarea(props: PropsCampos) {
  return (
    <>
      <CamposPrincipales {...props} />
      <CamposDetalle {...props} />
    </>
  );
}
