import axe from "axe-core";

export type Violacion = axe.Result;

/**
 * Reglas que no se pueden evaluar en un componente suelto dentro de jsdom:
 * - `color-contrast` necesita los estilos reales; se comprueba en
 *   `tests/estilos` (los temas) y en las pruebas de Playwright (el navegador).
 * - `region` exige que todo esté dentro de un landmark, y un componente
 *   aislado no lo lleva (los landmarks están en el layout).
 * - `heading-order` solo se puede juzgar con la página completa: un componente
 *   suelto empieza en h3 o h4. Lo revisan las pruebas de Playwright.
 */
const REGLAS_DESACTIVADAS = ["color-contrast", "region", "heading-order"];

/** Ejecuta axe-core sobre un elemento y devuelve las violaciones que encuentra. */
export async function violacionesDeAxe(
  elemento: Element,
): Promise<Violacion[]> {
  const rules = Object.fromEntries(
    REGLAS_DESACTIVADAS.map((id): [string, { enabled: boolean }] => [
      id,
      { enabled: false },
    ]),
  );
  const resultado = await axe.run(elemento, { rules });
  return resultado.violations;
}

/** Una línea por violación, para que el fallo de una prueba diga qué pasó. */
export function resumen(violaciones: readonly Violacion[]): string[] {
  return violaciones.map((v) => {
    const cantidad = v.nodes.length;
    const elementos = cantidad === 1 ? "elemento" : "elementos";
    return `${v.id}: ${v.help} (${cantidad} ${elementos})`;
  });
}

/** Lo habitual: `expect(await problemasDeAccesibilidad(container)).toEqual([])`. */
export async function problemasDeAccesibilidad(
  elemento: Element,
): Promise<string[]> {
  return resumen(await violacionesDeAxe(elemento));
}
