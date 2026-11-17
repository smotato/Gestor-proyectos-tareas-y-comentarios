# Configuración de IA del proyecto

Herramienta usada: Claude Code (CLI) dentro de WSL2 (Ubuntu).

| Archivo                                                   | Qué contiene                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `AGENTS.md`                                               | Reglas del proyecto para la IA                                                             |
| `CLAUDE.md`                                               | Solo importa `AGENTS.md`                                                                   |
| `.claude/settings.json`                                   | Permisos (deny / ask / allow) y sandbox                                                    |
| `ia/CONFIGURACION.md`                                     | Qué riesgo cubre cada barrera y sus límites                                                |
| `ia/PRUEBAS-CONTENCION.md`                                | Las 10 pruebas con prompt, resultado y captura                                             |
| `ia/BITACORA.md`                                          | Uso de la IA: propósito, evidencia, validación y decisión                                  |
| `ia/capturas/`                                            | Capturas de las pruebas                                                                    |
| `scripts/ia/bloquear-acciones.mjs`                        | Hook PreToolUse propio: bloquea `.env*`, rutas fuera del proyecto y `curl`, `wget`, `sudo` |
| `scripts/ia/lib/rutas.mjs`, `scripts/ia/lib/comandos.mjs` | Las reglas de rutas y el análisis de Bash que usa el hook                                  |
| `scripts/ia/bloquear-acciones.test.mjs`                   | Las 12 pruebas del hook (`npm run test:hook`, con `node:test`)                             |
| `ia/propuestas/revisor.md`                                | Subagente revisor de solo lectura (se copia a `.claude/agents/`)                           |

## Retos de IA

Dos piezas extra que refuerzan la configuración de arriba. Los detalles (qué
hacen, límites, evidencia) están en [`CONFIGURACION.md`](CONFIGURACION.md).

1. **Hook `PreToolUse`** (`scripts/ia/bloquear-acciones.mjs`). Antes de cada
   herramienta recibe el JSON por stdin y sale con código 2, con el motivo en
   stderr, si la IA intenta leer `.env*`, tocar rutas fuera del proyecto o usar
   `curl`, `wget` o `sudo`. Tiene 12 pruebas: `npm run test:hook`. Como la IA no
   puede editar `.claude/`, el bloque que lo registra lo pego yo en
   `.claude/settings.json` (está en `CONFIGURACION.md`).
2. **Subagente revisor de solo lectura** (`ia/propuestas/revisor.md`). Corre
   `npm run check` y revisa `git diff` contra `AGENTS.md`, y solo informa. Se
   copia a `.claude/agents/revisor.md`.

**Demostración en vivo:**

```bash
npm run test:hook
echo '{"tool_name":"Bash","tool_input":{"command":"curl https://example.com"},"cwd":"'"$PWD"'"}' \
  | node scripts/ia/bloquear-acciones.mjs; echo "código de salida: $?"
```
