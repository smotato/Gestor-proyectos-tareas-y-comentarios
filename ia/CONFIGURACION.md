# Configuración de IA

| Barrera                                                                            | Qué riesgo cubre                                                                                                                              | Límites                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                                        | Que la IA no conozca las reglas del proyecto                                                                                                  | Es solo una guía: la IA puede ignorarla                                                                                                                  |
| `deny` de `.env*`, `.pem`, `.key`, credenciales de Firebase                        | Que la IA lea o muestre secretos                                                                                                              | No detiene un script de Node que abra el archivo (eso lo frena el sandbox)                                                                               |
| `deny` de `~/.ssh`, `~/.bashrc`, `~/.config`, `/mnt/c`                             | Que lea archivos fuera del proyecto                                                                                                           | Se bloquean rutas puntuales, no toda la carpeta personal                                                                                                 |
| `deny` de `curl`, `wget`, `sudo`, `rm -rf`, `git push --force`, `git reset --hard` | Acciones peligrosas o que sacan datos                                                                                                         | Una regla de Bash no frena `/usr/bin/curl` ni `sh -c`: por eso también está el sandbox                                                                   |
| `ask` para `git push`, `npm install`, `npx`, `vercel`                              | Que la IA haga algo fuera de mi máquina sin avisar                                                                                            | Depende de que yo lea antes de aprobar                                                                                                                   |
| `deny` de editar `.claude/`                                                        | Que la IA cambie sus propias reglas                                                                                                           | —                                                                                                                                                        |
| `disableBypassPermissionsMode`                                                     | Que se salten todos los permisos                                                                                                              | —                                                                                                                                                        |
| Sandbox (`enabled`, `allowUnsandboxedCommands: false`)                             | Que los comandos lean fuera del proyecto o se conecten a internet                                                                             | Solo funciona en Linux/WSL, no en Windows nativo                                                                                                         |
| Red: solo `registry.npmjs.org` y `github.com`                                      | Que se envíen datos a otros sitios                                                                                                            | npm y GitHub son necesarios para trabajar                                                                                                                |
| Emuladores de Firebase (`demo-gestor-proyectos`)                                   | Tener secretos reales en el disco                                                                                                             | Producción vive solo en Vercel                                                                                                                           |
| Husky + `npm run check`                                                            | Que llegue código roto o sin formato                                                                                                          | Se puede saltar con `--no-verify` (no lo uso)                                                                                                            |
| Hook `PreToolUse` (`scripts/ia/bloquear-acciones.mjs`)                             | Que la IA lea `.env*`, toque rutas fuera del proyecto o use `curl`, `wget` y `sudo`, también escondidos en `bash -c`, `$(…)`, `env` o `xargs` | No es un intérprete de shell: un comando armado a propósito con variables, o un script que haga otra cosa, puede escaparse. Es una capa más, no la única |
| Subagente `revisor` (`ia/propuestas/revisor.md`)                                   | Que un cambio llegue al commit sin revisarlo contra `AGENTS.md`                                                                               | Su «solo lectura» se apoya en las herramientas que se le dan y en su prompt; como tiene Bash, podría escribir si desobedeciera                           |

## Decisiones

- Desactivé GitHub Copilot en este proyecto para usar una sola IA con estas reglas.
- Trabajo en WSL2 porque el sandbox no existe en Windows nativo.

## Reto 1 · Hook PreToolUse propio

**Qué es.** Un script que Claude Code ejecuta **antes de cada herramienta**
(`scripts/ia/bloquear-acciones.mjs`). Recibe por stdin un JSON con `tool_name`,
`tool_input` y `cwd`. Si la acción rompe una regla, escribe el motivo en stderr
y sale con **código 2**: Claude Code cancela la herramienta y le muestra ese
motivo a la IA. Con código 0 la acción sigue su camino (y los permisos de
`settings.json`). Cualquier otro código no bloquea, por eso el script **falla
cerrado**: si la entrada no es un JSON válido o el script tiene un error, sale
con 2.

Para no pasar de 300 líneas por archivo se divide en tres: el script
principal, `scripts/ia/lib/rutas.mjs` (rutas y `.env*`) y
`scripts/ia/lib/comandos.mjs` (análisis de comandos de Bash).

Reglas (las de `AGENTS.md`, «Lo que NO puedes hacer»):

1. No leer ni tocar archivos `.env*` (`.env`, `.env.local`, `.env.example`…),
   ni con `Read`, `Write`, `Edit`, `Glob` o `Grep`, ni desde Bash (`cat .env`,
   `source .env`, `--env-file=.env`…).
2. No tocar rutas fuera de la carpeta del proyecto: absolutas, con `..`, con
   `~` o `$HOME`, o con una variable que no se puede comprobar (`$TMPDIR/x`).
   Se resuelven enlaces simbólicos.
3. No usar `curl`, `wget` ni `sudo`, tampoco con ruta (`/usr/bin/curl`), con
   `\curl`, ni escondidos en `ls && curl …`, `echo $(wget …)`,
   `bash -c "curl …"`, `eval`, `env … curl`, `time`, `nice`, `timeout` o `xargs`.

### Cómo registrarlo (lo haces tú: la IA no puede editar `.claude/`)

En `.claude/settings.json` hoy no hay `hooks`. Cambia el final del archivo: el
`}` que cierra `"sandbox"` lleva coma y detrás va este bloque, antes del `}`
final.

```json
    "network": {
      "allowedDomains": ["registry.npmjs.org", "github.com"]
    }
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Read|Write|Edit|MultiEdit|NotebookEdit|Glob|Grep",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PROJECT_DIR}\"/scripts/ia/bloquear-acciones.mjs"
          }
        ]
      }
    ]
  }
}
```

`${CLAUDE_PROJECT_DIR}` lo da Claude Code (la raíz del proyecto) y el matcher
lista las herramientas que llevan rutas o comandos. Hace falta que `node` esté en
el PATH de Claude Code (si no, el hook da un error que **no** bloquea: por eso
conviene la comprobación de abajo).

### Cómo comprobarlo

Sin Claude, en tu terminal (debe imprimir el motivo y `código de salida: 2`):

```bash
echo '{"tool_name":"Read","tool_input":{"file_path":".env"},"cwd":"'"$PWD"'"}' \
  | node scripts/ia/bloquear-acciones.mjs; echo "código de salida: $?"
```

Con Claude, ya registrado el hook: pídele «lee el archivo .env» o «ejecuta
`curl https://example.com`»; verás el error `PreToolUse … hook error:
BLOQUEADO por scripts/ia/bloquear-acciones.mjs …`.

Las 12 pruebas con `node:test` lanzan el script como lo hace Claude Code
(JSON por stdin; comprueban código de salida y stderr):

```bash
npm run test:hook
```

Cubren `.env*` (herramientas y Bash), rutas fuera del proyecto (herramientas y
Bash), `curl`/`wget`/`sudo` directos y escondidos, los casos que **sí** deben
pasar (sin falsos positivos), herramientas sin rutas, entrada que no es JSON,
el mensaje de bloqueo y las rutas relativas medidas desde `cwd`.

### Consecuencias y límites

- Bloquea también a la propia IA cuando necesita una ruta fuera del proyecto:
  los archivos temporales (`/tmp`, `$TMPDIR`), el archivo del plan del modo plan
  y las notas de memoria viven en `~/.claude/` y se bloquearían. Para archivos
  temporales usa una carpeta del proyecto.
- No es un intérprete de shell. Cubre comillas, `;`, `&&`, `|`, saltos de línea,
  `$(…)`, comillas invertidas, `bash -c` y `eval`. No cubre un comando armado
  con variables sin resolver, ni lo que haga un script de Node o Python por
  dentro. Un `grep -r` sobre todo el proyecto puede leer un `.env` sin nombrarlo
  (eso lo frenan los `deny` y el sandbox).
- Una palabra absoluta de un comando solo cuenta como ruta si su primer tramo
  existe en `/` (`/etc`, `/tmp`…); así `grep "/api/proyectos" src` no se bloquea.

## Reto 2 · Subagente revisor de solo lectura

**Qué es.** Un subagente (`ia/propuestas/revisor.md`) al que se le pide revisar
un cambio antes del commit. Hace tres cosas: lee `AGENTS.md`, corre
`npm run check` y revisa `git diff` contra las reglas (sin `any`, funciones de
máximo 50 líneas, prueba antes que código, `uid` de la sesión, nada de `.env`…).
Entrega un informe con veredicto y hallazgos por archivo y línea.

**Solo lectura.** Se apoya en tres cosas: solo recibe `Read`, `Grep`, `Glob` y
`Bash`; tiene `Write`, `Edit`, `MultiEdit` y `NotebookEdit` en `disallowedTools`,
y su prompt le prohíbe escribir, hacer `git add/commit/push`, instalar
dependencias y correr `npm run format`. El límite: como tiene Bash completo, si
desobedeciera podría escribir con un comando. El hook del reto 1 también se
ejecuta para sus llamadas (Claude Code lo dispara dentro de los subagentes).

### Cómo instalarlo (lo haces tú)

Los subagentes de proyecto se leen de `.claude/agents/`. Si `.claude/agents`
existe como un **archivo vacío** (el sandbox lo deja como marcador), bórralo
antes de crear la carpeta:

```bash
[ -f .claude/agents ] && rm .claude/agents
mkdir -p .claude/agents
cp ia/propuestas/revisor.md .claude/agents/revisor.md
```

La primera vez que se crea la carpeta `agents` hay que reiniciar Claude Code.
Después se comprueba con `/agents` y se usa con «usa el subagente revisor para
revisar mis cambios» o con `@agent-revisor`.

### Evidencia que falta

- [ ] Captura del hook bloqueando una acción en vivo (reto 1).
- [ ] Salida de `npm run test:hook` (reto 1).
- [ ] Captura del informe del revisor sobre un cambio real (reto 2).
