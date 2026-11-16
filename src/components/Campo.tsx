interface PropsBase {
  nombre: string;
  etiqueta: string;
  error?: string;
  valorInicial?: string;
}

interface PropsCampo extends PropsBase {
  tipo: "email" | "password" | "text" | "date";
  autoComplete?: string;
  requerido?: boolean;
}

interface PropsSelect extends PropsBase {
  opciones: readonly { valor: string; texto: string }[];
}

type PropsAreaTexto = PropsBase;

function MensajeError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={`${id}-error`} className="campo__error">
      {error}
    </p>
  ) : null;
}

/** `aria-invalid` y `aria-describedby` apuntan al error en texto junto al campo. */
function atributosError(id: string, error?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

/** Campo con <label> asociado y error en texto anunciado junto al input. */
export function Campo(props: PropsCampo) {
  const id = `campo-${props.nombre}`;
  return (
    <div className="campo">
      <label htmlFor={id}>{props.etiqueta}</label>
      <input
        id={id}
        name={props.nombre}
        type={props.tipo}
        autoComplete={props.autoComplete}
        defaultValue={props.valorInicial}
        required={props.requerido ?? true}
        {...atributosError(id, props.error)}
      />
      <MensajeError id={id} error={props.error} />
    </div>
  );
}

export function CampoSelect(props: PropsSelect) {
  const id = `campo-${props.nombre}`;
  return (
    <div className="campo">
      <label htmlFor={id}>{props.etiqueta}</label>
      <select
        id={id}
        name={props.nombre}
        defaultValue={props.valorInicial}
        {...atributosError(id, props.error)}
      >
        {props.opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
      <MensajeError id={id} error={props.error} />
    </div>
  );
}

export function CampoAreaTexto(props: PropsAreaTexto) {
  const id = `campo-${props.nombre}`;
  return (
    <div className="campo">
      <label htmlFor={id}>{props.etiqueta}</label>
      <textarea
        id={id}
        name={props.nombre}
        rows={3}
        defaultValue={props.valorInicial}
        {...atributosError(id, props.error)}
      />
      <MensajeError id={id} error={props.error} />
    </div>
  );
}
