import type { ButtonHTMLAttributes } from "react";

export type VarianteBoton = "primario" | "secundario" | "peligro";

/** Clases de un botón; sirven también para un `<Link>` con aspecto de botón. */
export function clasesBoton(variante: VarianteBoton = "primario"): string {
  return variante === "primario" ? "boton" : `boton boton--${variante}`;
}

interface PropsBoton extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  variante?: VarianteBoton;
}

/** Botón de verdad (`<button>`); por defecto no envía formularios. */
export function Boton({
  variante = "primario",
  type = "button",
  ...resto
}: PropsBoton) {
  return <button type={type} className={clasesBoton(variante)} {...resto} />;
}
