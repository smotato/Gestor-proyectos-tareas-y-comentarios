/** Esqueleto mientras carga la página; anunciado a lectores de pantalla. */
export default function Cargando() {
  return (
    <div className="esqueleto" role="status" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="esqueleto__linea esqueleto__linea--titulo" />
      <div className="esqueleto__linea" />
      <div className="esqueleto__linea esqueleto__linea--corta" />
    </div>
  );
}
