# Calidad: evidencias de la sección 14.6

Este documento reúne las evidencias que pide la sección 14.6 de
`docs/requisitos.md`. Cada celda de medición que dice **PENDIENTE** está sin
medir a propósito: requiere un navegador, la URL desplegada o ejecutar algo que
todavía no se ha hecho, y no se rellena con cifras inventadas. Cuando se mida,
se reemplaza `PENDIENTE` por el valor real y se guarda el informe en
`calidad/`.

## 1. Resumen

| Requisito de 14.6                                        | Dónde                                  | Estado                                                                                          |
| -------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Integración continua en verde                            | [§2](#2-integración-continua)          | Hecho (ver la nota de abajo)                                                                    |
| Informes de Lighthouse, móvil y escritorio, de 3 páginas | [§3](#3-lighthouse)                    | Hecho: 6 informes; se cumplen todas las metas salvo SEO de `/proyectos` (decisión de diseño)    |
| Capturas de las páginas en 360, 768 y 1024 px            | [§4](#4-capturas-en-360-768-y-1024-px) | **Pendiente**: el script está listo (`npm run capturas`); falta ejecutarlo y subir las imágenes |
| Resultado de axe en Vitest (componentes)                 | [§5](#5-axe-y-validador-html)          | Hecho: lo ejecuta la CI dentro de `npm run check`                                               |
| Resultado de axe en Playwright (3 anchos)                | [§5](#5-axe-y-validador-html)          | **Pendiente**: no corre en la CI; hay que ejecutar `npm run e2e`                                |
| Validador HTML del W3C                                   | [§5](#5-axe-y-validador-html)          | **Pendiente**                                                                                   |
| Lista de comprobación manual, con fecha                  | [§6](#6-lista-de-comprobación-manual)  | **Pendiente**                                                                                   |
| Tabla de LCP, INP y CLS (antes y después)                | [§7](#7-core-web-vitals)               | Parcial: LCP, CLS y TBT medidos (sin «antes»); INP **pendiente**                                |
| Retos elegidos, con evidencia y cómo reproducirlos       | [§8](#8-retos-de-excelencia-elegidos)  | Hecho: 3 retos implementados y documentados; falta la salida de `npm run e2e`                   |
| Demostración en vivo                                     | Toda la guía                           | **Pendiente**: se ensaya con los comandos de este documento                                     |

Nota sobre la CI: el enlace de la ejecución lo aportó el autor y esta sesión
no lo abrió. Antes de entregar, confirma que está en verde y que es del último
commit.

## 2. Integración continua

**Ejecución en verde:**
[Actions, ejecución 44027305176](https://github.com/smotato/Gestor-proyectos-tareas-y-comentarios/actions/runs/44027305176)

El flujo `.github/workflows/ci.yml` se ejecuta en cada `push` y `pull request`
a `main`, con Node 24, sin secretos (la compilación usa variables ficticias de
Firebase). Hace, en este orden:

1. `npm ci`
2. `npm run check`: tipos (`next typegen` y `tsc`), lint sin advertencias,
   formato y las pruebas de Vitest con cobertura.
3. `npm run test:hook`: pruebas del hook de IA con `node:test`.
4. `npm run build`: compilación de producción.
5. `npm audit --audit-level=high`: auditoría de dependencias.

Las pruebas de Playwright (`npm run e2e`) **no** corren en la CI: necesitan un
navegador y compilar la app.

### Cómo correrlo en local

```bash
npm ci               # instala exactamente lo que fija package-lock.json
npm run check        # tipos + lint + formato + pruebas con cobertura
npm run test:hook    # pruebas del hook de IA (node:test)
npm run build        # compilación de producción
```

### Cobertura

`npm run test` ejecuta Vitest con cobertura (proveedor v8): imprime la tabla en
la terminal y escribe el informe en `coverage/` (esa carpeta no se sube a Git).
Mide `src/services/**` y `src/schemas/**` y **falla si alguna métrica baja del
80 %** (líneas, funciones, ramas y sentencias, según `vitest.config.ts`).

```bash
npm run test                       # tabla de cobertura en la terminal
explorer.exe "$(wslpath -w coverage/index.html)"   # informe HTML (en WSL; en otro sistema, abre el archivo)
```

Resumen de cobertura de la última ejecución local: **PENDIENTE** (pegar aquí la
tabla que imprime `npm run test`).

## 3. Lighthouse

Metas de 14.1, sobre la **URL de producción** (Vercel): Rendimiento ≥ 90 y
Accesibilidad, Buenas prácticas y SEO ≥ 95. Se midieron móvil y escritorio.

URL de producción medida:
<https://gestor-proyectos-tareas-y-comentari.vercel.app> (informes guardados el
2026-11-19).

| Página       | Tipo                | Dispositivo | Rendimiento | Accesibilidad | Buenas prácticas | SEO      | Informe                                                                   |
| ------------ | ------------------- | ----------- | ----------- | ------------- | ---------------- | -------- | ------------------------------------------------------------------------- |
| Meta         |                     | Ambos       | ≥ 90        | ≥ 95          | ≥ 95             | ≥ 95     |                                                                           |
| `/`          | Pública             | Móvil       | 99 ✓        | 100 ✓         | 100 ✓            | 100 ✓    | [inicio-movil.html](calidad/lighthouse/inicio-movil.html)                 |
| `/`          | Pública             | Escritorio  | 100 ✓       | 100 ✓         | 100 ✓            | 100 ✓    | [inicio-escritorio.html](calidad/lighthouse/inicio-escritorio.html)       |
| `/login`     | Con formulario      | Móvil       | 98 ✓        | 100 ✓         | 96 ✓             | 100 ✓    | [login-movil.html](calidad/lighthouse/login-movil.html)                   |
| `/login`     | Con formulario      | Escritorio  | 100 ✓       | 100 ✓         | 96 ✓             | 100 ✓    | [login-escritorio.html](calidad/lighthouse/login-escritorio.html)         |
| `/proyectos` | Con sesión iniciada | Móvil       | 98 ✓        | 100 ✓         | 96 ✓             | **63 ✗** | [proyectos-movil.html](calidad/lighthouse/proyectos-movil.html)           |
| `/proyectos` | Con sesión iniciada | Escritorio  | 100 ✓       | 100 ✓         | 96 ✓             | **63 ✗** | [proyectos-escritorio.html](calidad/lighthouse/proyectos-escritorio.html) |

Se cumplen todas las metas **excepto el SEO de `/proyectos` (63)**. Los
informes de la portada se llaman `inicio-*`.

### SEO 63 en `/proyectos`: decisión de diseño

Sacado de `proyectos-movil.html` (categoría SEO, auditorías con puntuación
menor que 1): solo falla **`is-crawlable` · «Page is blocked from indexing»**
(puntuación 0). Lighthouse señala dos cosas: la etiqueta
`<meta name="robots" content="noindex, nofollow" />` de la página y el archivo
`robots.txt` de producción.

Es lo previsto en el código: `src/app/proyectos/page.tsx` declara
`robots: SIN_INDEXAR` (`src/lib/seo.ts`) y `src/app/robots.ts` excluye `/api/`,
`/proyectos` e `/invitacion/`. Una página con sesión es privada y no debe
aparecer en un buscador, así que **no se corrige**: el 63 es consecuencia de
no indexarla y no hay ninguna otra auditoría de SEO fallida. `/` y `/login`,
que sí son indexables, sacan 100.

### Buenas prácticas 96 en `/login` y `/proyectos`

Cumple la meta (≥ 95). Lo que restó puntos, en los informes móviles, es la
auditoría `inspector-issues` («Issues were logged in the Issues panel in Chrome
DevTools»), con un problema de tipo _Content security policy_.

### Cómo generar los informes en DevTools

1. Abre la **URL de producción** en Chrome, en una ventana de incógnito y sin
   extensiones (así no alteran la medición). Para `/proyectos`, inicia sesión
   primero.
2. Abre DevTools (`F12`) y la pestaña **Lighthouse**.
3. Elige el modo **Navigation**, marca las cuatro categorías (**Performance**,
   **Accessibility**, **Best practices** y **SEO**) y el dispositivo **Mobile**.
4. Para `/proyectos`, abre la configuración (el engranaje) y **desmarca «Clear
   storage»**: si no, Lighthouse borra la sesión antes de medir y verás el
   inicio de sesión en lugar de la página.
5. Pulsa **Analyze page load**.
6. Repite con el dispositivo **Desktop**, y luego con las otras dos páginas.
7. En cada informe, abre el menú de los tres puntos (arriba a la derecha) y elige
   **Save as HTML**. Guarda el archivo en `calidad/lighthouse/` con el nombre de
   la tabla (`<página>-movil.html` o `<página>-escritorio.html`; la portada es
   `inicio`).
8. Copia las cuatro puntuaciones a la tabla de arriba.

## 4. Capturas en 360, 768 y 1024 px

El script `e2e/capturas/capturas.spec.ts` abre una compilación de producción de
la app y guarda una captura de página completa de `/`, `/login` y `/registro` en
cada ancho, siempre en tema claro y sin animaciones.

```bash
npx playwright install chromium   # una vez; descarga el navegador (unos 150 MB)
npm run capturas                  # compila, arranca la app en el puerto 3100 y captura
```

Las imágenes quedan en `calidad/capturas/` con el nombre
`<página>-<ancho>.png`. **Estado: PENDIENTE**, todavía no se han generado; los
enlaces de la tabla funcionarán cuando se ejecute el comando y se suban las
imágenes.

| Página                    | 360 px                                                | 768 px                                                | 1024 px                                                 |
| ------------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| Portada `/`               | [portada-360.png](calidad/capturas/portada-360.png)   | [portada-768.png](calidad/capturas/portada-768.png)   | [portada-1024.png](calidad/capturas/portada-1024.png)   |
| Inicio de sesión `/login` | [login-360.png](calidad/capturas/login-360.png)       | [login-768.png](calidad/capturas/login-768.png)       | [login-1024.png](calidad/capturas/login-1024.png)       |
| Registro `/registro`      | [registro-360.png](calidad/capturas/registro-360.png) | [registro-768.png](calidad/capturas/registro-768.png) | [registro-1024.png](calidad/capturas/registro-1024.png) |

El script no captura las páginas que exigen sesión. Para `/proyectos`, un
proyecto y el detalle de una tarea, hazlo a mano con la sesión iniciada: en
DevTools, modo dispositivo con el ancho elegido, `Ctrl+Mayús+P`, escribe
**Capture full size screenshot** y guarda el archivo como
`calidad/capturas/proyectos-360.png` (y de igual forma con los otros anchos y
páginas). **PENDIENTE.**

## 5. axe y validador HTML

### Resultado de axe

| Suite                                 | Comando                               | Qué revisa                                                                                                | Resultado                                                                   |
| ------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Vitest con jsdom                      | `npm run test -- tests/accesibilidad` | Más de 15 componentes y estados, con `axe-core` y un ayudante propio                                      | Hecho: pasa dentro de `npm run check` en la CI. Salida local: **PENDIENTE** |
| Playwright con `@axe-core/playwright` | `npm run e2e`                         | `/`, `/login` y `/registro` en 360, 768 y 1024 px y en los cuatro temas, con las reglas WCAG 2.0 a 2.2 AA | **PENDIENTE**                                                               |
| Extensión axe DevTools                | Manual, en el navegador               | Páginas con sesión, que Playwright no recorre (`/proyectos` y el detalle de una tarea)                    | **PENDIENTE**                                                               |

En jsdom no se evalúan `color-contrast`, `region` ni `heading-order` (necesitan
estilos reales o la página entera); las revisa Playwright en un navegador.

```text
PENDIENTE: pegar aquí la salida de `npm run test -- tests/accesibilidad`
PENDIENTE: pegar aquí el resumen de `npm run e2e` (el informe HTML queda en calidad/playwright-report/)
```

### Validador HTML del W3C

Meta de 14.4: sin errores en el validador. Servicio:
<https://validator.w3.org/nu/>.

Cómo hacerlo con cada página:

1. Compila y arranca la app: `npm run build` y `npm run start -- --port 3100`
   (así se valida el HTML de producción, no el del modo desarrollo).
2. Abre la página en Chrome (para las que exigen sesión, con la sesión
   iniciada), pulsa `Ctrl+U` para ver el código fuente y copia todo.
3. En el validador, abre la pestaña **Check by text input**, pega el HTML y
   pulsa **Check**.
4. Anota los errores y las advertencias en la tabla. Para las páginas públicas
   desplegadas también sirve la pestaña **Check by address** con la URL de
   producción.

| Página            | Errores   | Advertencias | Fecha     | Estado        |
| ----------------- | --------- | ------------ | --------- | ------------- |
| `/`               | PENDIENTE | PENDIENTE    | PENDIENTE | **Pendiente** |
| `/login`          | PENDIENTE | PENDIENTE    | PENDIENTE | **Pendiente** |
| `/registro`       | PENDIENTE | PENDIENTE    | PENDIENTE | **Pendiente** |
| `/proyectos`      | PENDIENTE | PENDIENTE    | PENDIENTE | **Pendiente** |
| `/proyectos/<id>` | PENDIENTE | PENDIENTE    | PENDIENTE | **Pendiente** |

## 6. Lista de comprobación manual

Lo automático detecta solo una parte de la accesibilidad (14.3): estas pruebas
se hacen a mano, con la app compilada (`npm run build` y `npm run start`) o la
desplegada. Marca cada casilla y anota la fecha **solo después de hacer la
prueba**.

- [ ] **Teclado.** Fecha: ____ · Resultado: ____
  - Cómo: sin tocar el ratón, recorre con `Tab` y `Mayús+Tab` `/login`,
    `/registro` y `/proyectos`; crea un proyecto; abre y cierra el diálogo de
    «Nueva tarea» (`Esc` lo cierra).
  - Criterio: orden lógico, todo se puede usar, ninguna trampa; el diálogo
    mantiene el foco dentro y lo devuelve al botón que lo abrió.
- [ ] **Foco visible.** Fecha: ____ · Resultado: ____
  - Cómo: con `Tab`, mira el anillo de foco de enlaces, botones, campos y
    selectores en los cuatro temas.
  - Criterio: siempre se ve (contraste de al menos 3:1) y ninguna cabecera lo
    tapa (WCAG 2.4.11).
- [ ] **«Saltar al contenido».** Fecha: ____ · Resultado: ____
  - Cómo: recarga la página y pulsa `Tab` una vez; luego `Enter`.
  - Criterio: el enlace aparece arriba a la izquierda; al activarlo el foco pasa
    al contenido principal y el siguiente `Tab` va al primer control de la
    página, no a la cabecera.
- [ ] **Zoom al 200 %.** Fecha: ____ · Resultado: ____
  - Cómo: con la ventana a unos 1280 px, `Ctrl` y `+` hasta el 200 %; recorre
    las páginas principales.
  - Criterio: no se pierde contenido ni funciones y no aparece scroll
    horizontal.
- [ ] **Reflow a 320 px.** Fecha: ____ · Resultado: ____
  - Cómo: DevTools, modo dispositivo, ancho 320 px y alto 568 px (WCAG 1.4.10).
  - Criterio: una columna, sin scroll horizontal, sin recortes.
- [ ] **Lector de pantalla (NVDA).** Fecha: ____ · Resultado: ____
  - Cómo: en Windows, con NVDA (`Ctrl+Alt+N` lo inicia) y Chrome o Firefox;
    navega por encabezados (`H`), por regiones (`D`) y por campos de formulario
    (`F`); envía un formulario vacío; abre el diálogo de nueva tarea; cambia el
    estado de una tarea y publica un comentario.
  - Criterio: cada campo se lee con su etiqueta; los errores se anuncian; el
    diálogo anuncia su nombre al abrirse; los mensajes de estado («Comentario
    publicado») se anuncian.
- [ ] **Modo oscuro.** Fecha: ____ · Resultado: ____
  - Cómo: cambia el tema del sistema a oscuro, o en DevTools, **Rendering**,
    «Emulate CSS media feature prefers-color-scheme: dark»; recorre las páginas.
  - Criterio: todo el texto es legible, los bordes y los campos se distinguen y
    no queda ninguna zona en claro.

El modo de alto contraste y los colores forzados de Windows se revisan en el
reto 3 ([§8](#8-retos-de-excelencia-elegidos)).

## 7. Core Web Vitals

Metas de 14.1, en la URL de producción. Los valores son de **laboratorio**
(Lighthouse, informes del 2026-11-19), no datos reales al percentil 75.
Cada celda es móvil y escritorio.

| Página       | LCP (meta ≤ 2,5 s) | CLS (meta ≤ 0,1) | TBT (meta ≤ 200 ms) |
| ------------ | ------------------ | ---------------- | ------------------- |
| `/`          | 1,8 s y 0,5 s ✓    | 0 y 0 ✓          | 120 ms y 0 ms ✓     |
| `/login`     | 1,9 s y 0,5 s ✓    | 0 y 0 ✓          | 130 ms y 0 ms ✓     |
| `/proyectos` | 1,7 s y 0,5 s ✓    | 0 y 0 ✓          | 150 ms y 0 ms ✓     |

Se cumplen todas las metas de LCP, CLS y TBT (el TBT es la aproximación de INP
en laboratorio).

| Métrica                            | Meta     | Resultado                                                       |
| ---------------------------------- | -------- | --------------------------------------------------------------- |
| INP (respuesta a cada interacción) | ≤ 200 ms | **PENDIENTE**: Lighthouse no lo mide en laboratorio (ver abajo) |

**Sin «antes» y «después».** No se midió antes del rediseño, así que no hay
cifras previas con las que comparar y no se atribuye ninguna mejora a un cambio
concreto: solo se registra el estado actual.

De apoyo (orientativas): FCP ≤ 1,8 s, TTFB ≤ 0,8 s y TBT ≤ 200 ms.

Presupuesto (14.1), con DevTools, pestaña **Network** y **Disable cache**:

| Concepto               | Meta     | Medido    |
| ---------------------- | -------- | --------- |
| JavaScript transferido | ≤ 200 kB | PENDIENTE |
| Página inicial         | ≤ 1 MB   | PENDIENTE |

### Cómo medir

- **LCP, CLS, FCP, TTFB y TBT:** Lighthouse en móvil sobre la URL de producción
  (los pasos están en la [§3](#3-lighthouse)), o
  [PageSpeed Insights](https://pagespeed.web.dev/), que además muestra datos
  reales al percentil 75 si el sitio tiene suficientes visitas.
- **INP:** Lighthouse **no lo mide** en laboratorio (usa TBT como aproximación).
  Mídelo en DevTools, pestaña **Performance**: pulsa grabar, interactúa con la
  página (abrir el diálogo de nueva tarea, cambiar el estado de una tarea,
  enviar el inicio de sesión), detén la grabación y mira la pista
  **Interactions**; la interacción más lenta es tu INP de esa sesión.
- **Presupuesto:** DevTools, pestaña **Network**, marca **Disable cache**,
  recarga y mira la barra inferior (transferido) y el filtro **JS**.
- `useReportWebVitals` (de `next/web-vitals`) **no está implementado** en el
  proyecto: las cifras salen de las herramientas de arriba.

### Cómo llenar «antes» y «después»

1. **Antes:** mide una versión anterior a las mejoras. Vercel conserva cada
   despliegue por commit, así que puedes medir uno antiguo desde su URL.
2. **Qué se hizo:** una frase por cada cambio que movió la métrica (con el
   commit), sin atribuir mejoras que no se hayan medido.
3. **Después:** mide la versión de producción actual con el mismo método y el
   mismo dispositivo.

## 8. Retos de excelencia elegidos

Retos de la sección 14.5 (se piden al menos 3). Los tres están implementados.

### Reto 1 · Pruebas de accesibilidad de componentes con axe

**Qué es.** Cada componente se dibuja con React Testing Library y se le pasa
[axe-core](https://github.com/dequelabs/axe-core) para buscar violaciones de
WCAG. No usa `vitest-axe` ni `jest-axe`: el ayudante propio
`tests/accesibilidad/axe.ts` llama directamente a `axe-core` y devuelve una
línea por violación, para que un fallo diga qué regla se rompió. Cubre más de 15
componentes y estados: formularios con errores de validación, el tablero como
lector y como editor, el diálogo abierto, los filtros, las listas y las cuatro
formas de una invitación.

**Control negativo.** `tests/accesibilidad/axe.test.tsx` comprueba que el
ayudante sí detecta problemas reales (una imagen sin `alt`, un botón sin
nombre, un campo sin etiqueta, un enlace vacío, un `select` sin nombre). Sin
eso, «0 violaciones» no probaría nada.

**Evidencia.** Código en `tests/accesibilidad/`. Lo ejecuta la CI dentro de
`npm run check` (enlace en la [§2](#2-integración-continua)). Salida local:
**PENDIENTE**.

**Comando exacto.**

```bash
npm run test -- tests/accesibilidad
```

### Reto 2 · Prueba en 3 anchos con Playwright

**Qué es.** Playwright abre una compilación de producción de la app y recorre la
portada, `/login` y `/registro` en **360, 768 y 1024 px** (tres proyectos en
`playwright.config.ts`). En cada ancho comprueba que no hay scroll horizontal,
que la página carga sin bloqueos del CSP ni errores en la consola, y que hay **0
violaciones de axe** (`@axe-core/playwright`, etiquetas WCAG 2.0 a 2.2 AA) en
los cuatro temas: claro, oscuro y sus versiones de alto contraste. Aquí sí se
evalúa el contraste, porque hay un navegador real.

**Evidencia.** Código en `e2e/accesibilidad.spec.ts` y `playwright.config.ts`.
El informe HTML queda en `calidad/playwright-report/` (no se sube a Git; se
guarda una captura o el resumen en `calidad/`). Hasta ahora **no se ha
ejecutado**: **PENDIENTE**.

**Comando exacto.**

```bash
npx playwright install chromium   # una vez (en WSL, si pide librerías: --with-deps)
npm run e2e
npx playwright show-report calidad/playwright-report
```

### Reto 3 · Modo oscuro y alto contraste

**Qué es.** La app respeta `prefers-color-scheme` (claro y oscuro), `prefers-contrast:
more` (alto contraste, en claro y en oscuro) y los colores forzados de Windows
(`forced-colors`). Los colores salen de nueve variables en `src/app/globals.css`
y ningún componente usa un color fijo.

**Qué se encontró.** Se midió cada par de colores de los temas claro y oscuro
que ya existían: **todos cumplían AA** (el peor, 4,40:1, es un borde sobre una
tarjeta; el mínimo para controles es 3:1). Lo que faltaba era el modo de alto
contraste. Se agregó con una meta más alta que AA: texto a 7:1 o más y
controles a 4,5:1 o más, bordes de 2 px y anillo de foco de 4 px.

**Evidencia.** `tests/estilos/contraste.test.ts` lee los colores de
`globals.css`, arma los cuatro temas como los resolvería el navegador y calcula
el contraste con la fórmula de WCAG; también falla si algún CSS usa un color
fijo fuera de los temas. Lo ejecuta la CI dentro de `npm run check`. Razones de
contraste con los valores actuales (una ✗ marcaría un par bajo el mínimo; no
hay ninguna):

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

Peor caso por tema (texto y controles): claro 5,89:1 y 4,40:1; oscuro 6,91:1 y
6,91:1; claro con alto contraste 10,02:1 y 10,02:1; oscuro con alto contraste
14,52:1 y 14,52:1. La revisión visual en el navegador (capturas de cada tema)
está **PENDIENTE**.

**Comando exacto.**

```bash
npm run test -- tests/estilos
```

A mano, en DevTools, pestaña **Rendering**: «Emulate CSS media feature
prefers-color-scheme», «prefers-contrast» y «forced-colors». En Windows, el
modo de alto contraste del sistema.
