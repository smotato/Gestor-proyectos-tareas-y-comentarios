import { render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { problemasDeAccesibilidad, violacionesDeAxe } from "./axe";

/**
 * Controles negativos: antes de confiar en que «0 violaciones» significa algo,
 * se comprueba que el ayudante sí detecta problemas reales de accesibilidad.
 *
 * El HTML defectuoso se escribe como texto (`innerHTML`) y no como JSX: es
 * defectuoso a propósito, y así el linter no lo toma por un error del código.
 */

const montados: HTMLElement[] = [];

/** Pone en el documento un contenedor con `html` y lo quita al terminar la prueba. */
function dibujar(html: string): HTMLElement {
  const contenedor = document.createElement("div");
  contenedor.innerHTML = html;
  document.body.append(contenedor);
  montados.push(contenedor);
  return contenedor;
}

afterEach(() => {
  while (montados.length > 0) montados.pop()?.remove();
});

const idsDe = (problemas: string[]) => problemas.map((p) => p.split(":")[0]);

describe("ayudante de axe · detecta problemas", () => {
  it("una imagen sin texto alternativo y un botón sin nombre", async () => {
    const contenedor = dibujar(
      '<img src="/foto.png"><button type="button"></button>',
    );
    const ids = idsDe(await problemasDeAccesibilidad(contenedor));
    expect(ids).toContain("image-alt");
    expect(ids).toContain("button-name");
  });

  it("un campo de formulario sin etiqueta", async () => {
    const contenedor = dibujar('<input type="text" name="correo">');
    const ids = idsDe(await problemasDeAccesibilidad(contenedor));
    expect(ids).toContain("label");
  });

  it("un enlace sin texto y un selector sin nombre", async () => {
    const contenedor = dibujar(
      '<a href="/inicio"></a><select name="rol"><option>Lector</option></select>',
    );
    const ids = idsDe(await problemasDeAccesibilidad(contenedor));
    expect(ids).toContain("link-name");
    expect(ids).toContain("select-name");
  });
});

describe("ayudante de axe · reglas de los controles", () => {
  it("existen y no están obsoletas en esta versión de axe-core", () => {
    const reglas = new Map(
      axe.getRules().map((r): [string, string[]] => [r.ruleId, r.tags]),
    );
    for (const id of [
      "image-alt",
      "button-name",
      "label",
      "link-name",
      "select-name",
    ]) {
      expect({ id, existe: reglas.has(id) }).toEqual({ id, existe: true });
      expect(reglas.get(id)).not.toContain("deprecated");
    }
  });
});

describe("ayudante de axe · no da falsos positivos", () => {
  it("un formulario bien etiquetado no tiene violaciones", async () => {
    const { container } = render(
      <form>
        <label htmlFor="correo">Correo electrónico</label>
        <input id="correo" name="correo" type="email" autoComplete="email" />
        <button type="submit">Enviar</button>
      </form>,
    );
    expect(await problemasDeAccesibilidad(container)).toEqual([]);
  });

  it("cada violación trae su regla y los elementos afectados", async () => {
    const contenedor = dibujar('<img src="/foto.png">');
    const [violacion] = await violacionesDeAxe(contenedor);
    expect(violacion?.id).toBe("image-alt");
    expect(violacion?.nodes).toHaveLength(1);
  });
});
