/** Contraste WCAG y lectura de los temas de color de `globals.css`. */

export type Tema = Readonly<Record<string, string>>;

function canal(valor: number): number {
  const c = valor / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa de un color `#rrggbb` (fórmula de WCAG 2). */
export function luminancia(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const rojo = canal((n >> 16) & 255);
  const verde = canal((n >> 8) & 255);
  const azul = canal(n & 255);
  return 0.2126 * rojo + 0.7152 * verde + 0.0722 * azul;
}

/** Razón de contraste entre dos colores: de 1 a 21. */
export function contraste(a: string, b: string): number {
  const [claro = 0, oscuro = 0] = [luminancia(a), luminancia(b)].sort(
    (x, y) => y - x,
  );
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Pares de texto sobre fondo (WCAG 1.4.3: 4,5:1). */
export const PARES_TEXTO: readonly (readonly [string, string])[] = [
  ["texto", "fondo"],
  ["texto", "superficie"],
  ["texto-tenue", "fondo"],
  ["texto-tenue", "superficie"],
  ["acento", "fondo"],
  ["acento", "superficie"],
  ["acento-texto", "acento"],
  ["error", "fondo"],
  ["error", "superficie"],
];

/** Bordes, foco e indicadores frente a lo que tienen al lado (WCAG 1.4.11: 3:1). */
export const PARES_CONTROLES: readonly (readonly [string, string])[] = [
  ["borde", "fondo"],
  ["borde", "superficie"],
  ["foco", "fondo"],
  ["foco", "superficie"],
  ["error", "fondo"],
  ["acento", "fondo"],
];

export const TOKENS_DE_COLOR = [
  "fondo",
  "superficie",
  "texto",
  "texto-tenue",
  "borde",
  "acento",
  "acento-texto",
  "error",
  "foco",
];

/** Los pares que no llegan al mínimo, con su razón; vacío si todo cumple. */
export function paresQueFallan(
  tema: Tema,
  pares: readonly (readonly [string, string])[],
  minimo: number,
): string[] {
  return pares.flatMap(([a, b]) => {
    const colorA = tema[a];
    const colorB = tema[b];
    if (!colorA || !colorB) return [`${a}/${b}: falta el token`];
    const razon = contraste(colorA, colorB);
    if (razon >= minimo) return [];
    return [`${a}/${b}: ${razon.toFixed(2)}:1 (mínimo ${minimo}:1)`];
  });
}

function tokens(bloque: string): Record<string, string> {
  const encontrados = bloque.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g);
  return Object.fromEntries(
    [...encontrados].map((m): [string, string] => [
      m[1] ?? "",
      (m[2] ?? "").toLowerCase(),
    ]),
  );
}

export interface Temas {
  claro: Tema;
  oscuro: Tema;
  claroAlto: Tema;
  oscuroAlto: Tema;
  /** Lo que redefine cada bloque `@media`, sin mezclar con el tema base. */
  bloques: { oscuro: Tema; alto: Tema; oscuroAlto: Tema };
}

/**
 * Reconstruye los cuatro temas como los resolvería el navegador: el `:root`
 * base y, encima y en el orden del archivo, los bloques `@media` que aplican.
 */
export function leerTemas(css: string): Temas {
  const limpio = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const base = tokens(/^:root\s*\{([^}]*)\}/m.exec(limpio)?.[1] ?? "");
  const medios = new Map<string, Tema>();
  const bloques = limpio.matchAll(
    /@media\s+([^{]+?)\s*\{\s*:root\s*\{([^}]*)\}\s*\}/g,
  );
  for (const [, condicion = "", cuerpo = ""] of bloques) {
    medios.set(condicion.replace(/\s+/g, " "), tokens(cuerpo));
  }
  const oscuro = medios.get("(prefers-color-scheme: dark)") ?? {};
  const alto = medios.get("(prefers-contrast: more)") ?? {};
  const oscuroAlto =
    medios.get("(prefers-color-scheme: dark) and (prefers-contrast: more)") ??
    {};
  return {
    claro: base,
    oscuro: { ...base, ...oscuro },
    claroAlto: { ...base, ...alto },
    oscuroAlto: { ...base, ...oscuro, ...alto, ...oscuroAlto },
    bloques: { oscuro, alto, oscuroAlto },
  };
}
