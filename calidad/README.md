# Evidencias de calidad

Carpeta para las evidencias de la sección 14.6 de `docs/requisitos.md`. Todo
debe poder **demostrarse en vivo** en la sustentación.

El estado de cada evidencia (hecho o pendiente), las tablas y los pasos exactos
para generarlas están en [`../CALIDAD.md`](../CALIDAD.md). Esta carpeta guarda
los archivos.

## Qué va en cada carpeta

- `lighthouse/`: informes de Lighthouse guardados desde DevTools como HTML, con
  el nombre `<página>-movil.html` o `<página>-escritorio.html` (portada, login y
  proyectos).
- `capturas/`: capturas en 360, 768 y 1024 px, con el nombre
  `<página>-<ancho>.png`, por ejemplo `login-360.png`. `npm run capturas` genera
  las de las páginas públicas; las de las páginas con sesión se hacen a mano.
- `playwright-report/`: informe HTML de `npm run e2e`. Se genera solo y **no se
  sube a Git**.

## Lo que falta (detalle en CALIDAD.md)

- Informes de Lighthouse, móvil y escritorio, de tres páginas (§3).
- Capturas en 360, 768 y 1024 px (§4).
- Resultado de axe en Playwright y del validador HTML (§5).
- Lista de comprobación manual con fecha (§6).
- Tabla de LCP, INP y CLS, antes y después (§7).
- Salida de `npm run e2e` para el reto 2 (§8).
