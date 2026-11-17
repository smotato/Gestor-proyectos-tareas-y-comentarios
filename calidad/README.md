# Evidencias de calidad

Carpeta para las evidencias de la sección 14.6 de `docs/requisitos.md`. Todo
debe poder **demostrarse en vivo** en la sustentación. Los retos elegidos y cómo
reproducirlos están en [`../CALIDAD.md`](../CALIDAD.md).

El informe HTML de Playwright (`calidad/playwright-report/`) se genera con
`npm run e2e` y no se sube a Git.

## Evidencias que faltan

Ninguna está hecha todavía: hace falta la app desplegada en Vercel y un
navegador, y yo no puedo ejecutarlos.

### Lighthouse

- [ ] Informes de **móvil** y de **escritorio** de 3 páginas, desde DevTools:
      una pública (`/`), una con formulario (`/login` o `/registro`) y una con
      sesión iniciada (`/proyectos`). Guardarlos como `calidad/lighthouse/<pagina>-movil.html`
      y `calidad/lighthouse/<pagina>-escritorio.html`.
- Metas: Rendimiento ≥ 90, Accesibilidad ≥ 95, Buenas prácticas ≥ 95 y SEO ≥ 95.

### Capturas en 360, 768 y 1024 px

- [ ] Capturas de las páginas principales (portada, `/login`, `/registro`,
      `/proyectos`, un proyecto y el detalle de una tarea) en los tres anchos.
      Guardarlas como `calidad/capturas/<pagina>-360.png`, `-768.png` y `-1024.png`.
- [ ] Una captura por tema (claro, oscuro, alto contraste) de una página.

### axe y validador HTML

- [ ] Resultado de **axe DevTools** de las mismas páginas (captura o exportación).
- [ ] Resultado del **validador HTML del W3C** de cada página (validar el HTML
      que sirve la app, con «Validate by direct input»). Guardarlo en
      `calidad/validador-html.md`.
- [ ] Salida de `npm run test -- tests/accesibilidad` y del informe de
      `npm run e2e` (reto 1 y reto 2).

### Lista de comprobación manual (con fecha)

- [ ] Recorrido **solo con teclado** (orden lógico, sin trampas, foco visible,
      enlace «Saltar al contenido»).
- [ ] **Zoom al 200 %** y reflow a 320 px sin perder contenido ni funciones.
- [ ] Una pasada con **lector de pantalla** (NVDA en Windows o VoiceOver).
- [ ] Los tres temas revisados a ojo (claro, oscuro, alto contraste).

Guardarla en `calidad/lista-manual.md`, con la fecha de cada punto.

### Web vitals

- [ ] Tabla de **LCP, INP y CLS** en la URL de producción (Vercel, perfil móvil,
      percentil 75), **antes y después** de las mejoras, y qué se hizo para
      mejorarlas. Guardarla en `calidad/web-vitals.md`.
- Metas: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1. INP no lo mide Lighthouse: se
  mide interactuando con la página.
- [ ] Presupuesto: JavaScript transferido ≤ 200 kB y página inicial ≤ 1 MB
      (DevTools → Red, sin caché).

### Retos

- [ ] Reto 1: pegar la salida de las pruebas de axe en componentes.
- [ ] Reto 2: ejecutar `npm run e2e` y guardar el resultado.
- [ ] Reto 3: capturas de los cuatro temas en el navegador.
