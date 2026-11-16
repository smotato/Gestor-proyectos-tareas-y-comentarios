# Bitácora de IA

| #   | Fecha      | Propósito                                                                                       | Evidencia                                                                              | Validación                                                                                          | Decisión                                                                                                                                                                  |
| --- | ---------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 2026-11-16 | Guía para preparar el entorno (WSL, Node, Claude Code)                                          | Conversación con Claude                                                                | Comprobé cada versión en la terminal                                                                | Aceptado con corrección (ver caso 1)                                                                                                                                      |
| 2   | 2026-11-16 | Borrador de `AGENTS.md`                                                                         | `AGENTS.md`                                                                            | Lo leí y lo comparé con la hoja de IA                                                               | Aceptado con cambios de redacción                                                                                                                                         |
| 3   | 2026-11-16 | Base de `.claude/settings.json`                                                                 | `.claude/settings.json`                                                                | `/doctor` y pruebas rápidas                                                                         | Corregido (ver caso 2)                                                                                                                                                    |
| 4   | 2026-11-16 | Implementar RF-02 con TDD: esquemas Zod de rol, miembro y proyecto, y tabla de permisos por rol | Commit `1a52238`; `ia/capturas/rf02-fase-roja.png` y `ia/capturas/rf02-fase-verde.png` | Vi fallar las pruebas (fase roja), luego `npm run check` pasó con cobertura ≥ 80 % y revisé el diff | Aceptado. El enunciado no decía qué hace el editor: decidí que crea, edita y elimina tareas y comentarios; solo el propietario elimina el proyecto, invita y cambia roles |

## Casos en que rechacé o corregí a la IA

### Caso 1 · Versión de Node equivocada

- **Qué propuso la IA:** instalar Node 22.
- **Qué estaba mal:** Firebase pide Node 24.12 o mayor (avisos `EBADENGINE`).
- **Qué hice:** cambié a Node 24 y agregué `.nvmrc` y `engines` en `package.json`.

### Caso 2 · La regla `Read(~/**)` bloqueaba el propio proyecto

- **Qué propuso la IA:** negar la lectura de toda la carpeta personal.
- **Qué estaba mal:** el proyecto está dentro de la carpeta personal, así que Claude no podía leer ni `AGENTS.md` (lo detecté con `/doctor`).
- **Qué hice:** cambié esa regla por bloqueos puntuales (`~/.ssh`, `~/.bashrc`, `~/.config`, `/mnt/c`).
