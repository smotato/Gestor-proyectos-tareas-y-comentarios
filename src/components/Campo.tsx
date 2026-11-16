interface PropsCampo {
  nombre: string;
  etiqueta: string;
  tipo: "email" | "password" | "text";
  autoComplete: string;
  error?: string;
}

/** Campo con <label> asociado y error en texto anunciado junto al input. */
export function Campo({
  nombre,
  etiqueta,
  tipo,
  autoComplete,
  error,
}: PropsCampo) {
  const id = `campo-${nombre}`;
  const idError = `${id}-error`;
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        name={nombre}
        type={tipo}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        required
      />
      {error ? (
        <p id={idError} className="campo__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
