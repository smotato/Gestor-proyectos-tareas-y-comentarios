# Configuración de IA

| Barrera                                                                            | Qué riesgo cubre                                                  | Límites                                                                                |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                                        | Que la IA no conozca las reglas del proyecto                      | Es solo una guía: la IA puede ignorarla                                                |
| `deny` de `.env*`, `.pem`, `.key`, credenciales de Firebase                        | Que la IA lea o muestre secretos                                  | No detiene un script de Node que abra el archivo (eso lo frena el sandbox)             |
| `deny` de `~/.ssh`, `~/.bashrc`, `~/.config`, `/mnt/c`                             | Que lea archivos fuera del proyecto                               | Se bloquean rutas puntuales, no toda la carpeta personal                               |
| `deny` de `curl`, `wget`, `sudo`, `rm -rf`, `git push --force`, `git reset --hard` | Acciones peligrosas o que sacan datos                             | Una regla de Bash no frena `/usr/bin/curl` ni `sh -c`: por eso también está el sandbox |
| `ask` para `git push`, `npm install`, `npx`, `vercel`                              | Que la IA haga algo fuera de mi máquina sin avisar                | Depende de que yo lea antes de aprobar                                                 |
| `deny` de editar `.claude/`                                                        | Que la IA cambie sus propias reglas                               | —                                                                                      |
| `disableBypassPermissionsMode`                                                     | Que se salten todos los permisos                                  | —                                                                                      |
| Sandbox (`enabled`, `allowUnsandboxedCommands: false`)                             | Que los comandos lean fuera del proyecto o se conecten a internet | Solo funciona en Linux/WSL, no en Windows nativo                                       |
| Red: solo `registry.npmjs.org` y `github.com`                                      | Que se envíen datos a otros sitios                                | npm y GitHub son necesarios para trabajar                                              |
| Emuladores de Firebase (`demo-gestor-proyectos`)                                   | Tener secretos reales en el disco                                 | Producción vive solo en Vercel                                                         |
| Husky + `npm run check`                                                            | Que llegue código roto o sin formato                              | Se puede saltar con `--no-verify` (no lo uso)                                          |

## Decisiones

- Desactivé GitHub Copilot en este proyecto para usar una sola IA con estas reglas.
- Trabajo en WSL2 porque el sandbox no existe en Windows nativo.
