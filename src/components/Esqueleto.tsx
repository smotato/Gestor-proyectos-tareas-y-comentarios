/** Esqueleto de carga anunciado a lectores de pantalla. */
export function Esqueleto({
  etiqueta,
  lineas = 3,
}: {
  etiqueta: string;
  lineas?: number;
}) {
  return (
    <div className="esqueleto" role="status" aria-live="polite">
      <span className="sr-only">{etiqueta}</span>
      {Array.from({ length: lineas }, (_, i) => (
        <div key={i} className="esqueleto__linea" />
      ))}
    </div>
  );
}
