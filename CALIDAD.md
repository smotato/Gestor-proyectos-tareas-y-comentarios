# Calidad: retos de excelencia

Retos elegidos de la sección 14.5 de `docs/requisitos.md` (se piden al menos 3).
Cada uno dice qué es, cómo reproducirlo y qué evidencia hay. Lo que todavía no
se ha ejecutado o capturado está marcado como **pendiente** y listado en
[`calidad/README.md`](calidad/README.md).

| Reto                                               | Cómo se comprueba         | Estado de la evidencia                                           |
| -------------------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| 1. Pruebas de accesibilidad de componentes con axe | `npm run test`            | Código listo; falta pegar la salida de la ejecución              |
| 2. Prueba en 3 anchos con Playwright               | `npm run e2e`             | Código listo; falta ejecutarla (necesita el navegador)           |
| 3. Modo oscuro y alto contraste                    | `npm run test` y DevTools | Contrastes calculados (abajo); falta la revisión en el navegador |

## Reto 1 · Pruebas de accesibilidad de componentes con axe

**Qué es.** Cada componente se dibuja con React Testing Library y se le pasa
[axe-core](https://github.com/dequelabs/axe-core) para buscar violaciones de
WCAG. No usa `vitest-axe` ni `jest-axe`: el ayudante propio
`tests/accesibilidad/axe.ts` llama directamente a `axe-core` y devuelve una
línea por violación, para que un fallo diga qué regla se rompió.

**Cómo reproducirlo.**

```bash
npm run test -- tests/accesibilidad
```

**Qué cubre** (más de 15 componentes y estados):

- Formularios: inicio de sesión, registro y los dos con errores de validación
  (`aria-invalid` y `aria-describedby`), comentarios, generar invitación.
- Tablero de tareas como lector, como editor y vacío; el diálogo de nueva
  tarea abierto y con su error; los filtros en sus tres formas.
- Listas y estados: comentarios, actividad, datos de la tarea, las cuatro
  formas de una invitación, el aviso de error y el esqueleto de carga.

**Control negativo.** `tests/accesibilidad/axe.test.tsx` comprueba que el
ayudante sí detecta problemas reales (una imagen sin `alt`, un botón sin nombre,
un campo sin etiqueta, un enlace vacío, un `select` sin nombre). Sin eso, «0
violaciones» no probaría nada.

**Lo que no revisa en jsdom** (y dónde se revisa): `color-contrast` (reto 3 y
Playwright), `region` y `heading-order` (necesitan la página completa:
Playwright).

**Evidencia.** El código está en `tests/accesibilidad/`. Falta pegar en
`calidad/` la salida de `npm run test -- tests/accesibilidad`.

## Reto 2 · Prueba en 3 anchos con Playwright

**Qué es.** Playwright abre una compilación de producción de la app y recorre
la portada, `/login` y `/registro` en **360, 768 y 1024 px** (tres proyectos en
`playwright.config.ts`). En cada ancho comprueba:

- que no hay scroll horizontal;
- que la página carga sin bloqueos de la política de seguridad (CSP) ni
  errores en la consola;
- **0 violaciones de axe** (`@axe-core/playwright`, etiquetas WCAG 2.0 a 2.2 AA)
  en los cuatro temas: claro, oscuro y sus versiones de alto contraste. Aquí
  sí se evalúa el contraste, porque hay un navegador real.

**Cómo reproducirlo.**

```bash
npm install                          # una vez
npx playwright install chromium      # una vez; descarga el navegador (unos 150 MB)
npm run e2e                          # compila, arranca la app en el puerto 3100 y prueba
npx playwright show-report calidad/playwright-report
```

En WSL puede faltar alguna librería del sistema para Chromium; si el comando
anterior lo avisa, usa `npx playwright install --with-deps chromium`.

**Evidencia.** El código está en `e2e/accesibilidad.spec.ts` y
`playwright.config.ts`. Falta ejecutarla: el informe HTML queda en
`calidad/playwright-report/` (no se sube a Git; se guarda una captura o el
resumen en `calidad/`).

## Reto 3 · Modo oscuro y alto contraste

**Qué es.** La app respeta `prefers-color-scheme` (claro y oscuro) y
`prefers-contrast: more` (alto contraste, en claro y en oscuro), y los colores
forzados de Windows (`forced-colors`). Los colores salen de nueve variables en
`src/app/globals.css`; ningún componente usa un color fijo.

**Qué se encontró.** Se midió cada par de colores de los temas claro y oscuro
que ya existían: **todos cumplían AA** (el peor, 4,40:1, es un borde sobre una
tarjeta; el mínimo para controles es 3:1). Lo que faltaba era el modo de alto
contraste, que no existía. Se agregó con una meta más alta que AA: texto a 7:1 o
más y controles a 4,5:1 o más, bordes de 2 px y anillo de foco de 4 px.

**Cómo reproducirlo.**

```bash
npm run test -- tests/estilos
```

La prueba lee los colores de `globals.css`, arma los cuatro temas como los
resolvería el navegador y calcula el contraste con la fórmula de WCAG. También
falla si algún CSS usa un color fijo fuera de los temas.

A mano, en DevTools → **Rendering**: «Emulate CSS media feature
prefers-color-scheme» y «prefers-contrast», y «Emulate CSS media feature
forced-colors». En Windows, el modo de alto contraste del sistema.

**Evidencia.** Razones de contraste calculadas con los valores actuales de
`globals.css` (una ✗ marcaría un par bajo el mínimo; no hay ninguna):

| Texto, mínimo 4,5:1 (WCAG 1.4.3) | Claro | Oscuro | Claro + alto contraste | Oscuro + alto contraste |
| -------------------------------- | ----- | ------ | ---------------------- | ----------------------- |
| Texto                            | 17.72 | 19.06  | 21.00                  | 21.00                   |
| Texto sobre tarjetas             | 16.12 | 16.97  | 21.00                  | 21.00                   |
| Texto secundario                 | 7.73  | 7.76   | 10.44                  | 16.55                   |
| Texto secundario sobre tarjetas  | 7.03  | 6.91   | 10.44                  | 16.55                   |
| Enlaces                          | 6.70  | 11.03  | 10.36                  | 14.78                   |
| Enlaces sobre tarjetas           | 6.10  | 9.82   | 10.36                  | 14.78                   |
| Texto de un botón                | 6.70  | 11.03  | 10.36                  | 14.78                   |
| Mensajes de error                | 6.47  | 10.48  | 10.02                  | 14.52                   |
| Errores sobre tarjetas           | 5.89  | 9.33   | 10.02                  | 14.52                   |

| Controles, mínimo 3:1 (WCAG 1.4.11) | Claro | Oscuro | Claro + alto contraste | Oscuro + alto contraste |
| ----------------------------------- | ----- | ------ | ---------------------- | ----------------------- |
| Borde de campos y tarjetas          | 4.83  | 7.76   | 14.89                  | 16.55                   |
| Borde sobre tarjetas                | 4.40  | 6.91   | 14.89                  | 16.55                   |
| Anillo de foco                      | 6.70  | 11.03  | 10.36                  | 21.00                   |
| Anillo de foco sobre tarjetas       | 6.10  | 9.82   | 10.36                  | 21.00                   |
| Borde de un campo con error         | 6.47  | 10.48  | 10.02                  | 14.52                   |
| Borde de un botón y pestaña activa  | 6.70  | 11.03  | 10.36                  | 14.78                   |

Peor caso por tema: claro 5,89:1 en texto y 4,40:1 en controles; oscuro 6,91:1 y
6,91:1; claro con alto contraste 10,02:1 y 10,02:1; oscuro con alto contraste
14,52:1 y 14,52:1.

Falta la revisión visual en el navegador (capturas de cada tema) y pegar la
salida de la prueba; está en `calidad/README.md`.

## Qué falta para entregar

Las evidencias generales de la sección 14.6 (Lighthouse, capturas, validador
HTML, tabla de LCP/INP/CLS, lista manual) y la salida de los retos están en
[`calidad/README.md`](calidad/README.md).
