#!/usr/bin/env node
/**
 * Hook PreToolUse de Claude Code (reto de IA, sección 15 de requisitos).
 *
 * Claude Code ejecuta este script antes de cada herramienta y le pasa por stdin
 * un JSON con `tool_name`, `tool_input` y `cwd`. Si la acción rompe una regla de
 * AGENTS.md, el script escribe el motivo en stderr y sale con código 2: Claude
 * Code cancela la herramienta y le muestra ese motivo a la IA. Con código 0 la
 * acción sigue su camino normal (y los permisos de settings.json).
 *
 * Reglas:
 *  1. No leer ni tocar archivos `.env*`.
 *  2. No tocar rutas fuera de la carpeta del proyecto.
 *  3. No usar `curl`, `wget` ni `sudo`.
 *
 * Falla cerrado: si la entrada no se puede leer o el script tiene un error,
 * sale con 2 (cualquier otro código dejaría pasar la acción).
 *
 * Límite honesto: no es un intérprete de shell. Entiende comillas, `;`, `&&`,
 * `|`, `$(…)`, `` `…` ``, `bash -c`, `eval` y envoltorios como `env`, `time` o
 * `xargs`, pero un comando armado a propósito con variables o ejecutando un
 * script que haga otra cosa puede escaparse. Por eso es una capa más junto con
 * los permisos y el sandbox de .claude/settings.json, no la única.
 */
import { Buffer } from "node:buffer";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { motivoParaComando } from "./lib/comandos.mjs";
import { motivoParaRuta, resolverReal } from "./lib/rutas.mjs";

/** Claves de `tool_input` que contienen rutas, según la herramienta. */
const CLAVES_DE_RUTA = {
  Read: ["file_path"],
  Write: ["file_path"],
  Edit: ["file_path"],
  MultiEdit: ["file_path"],
  NotebookEdit: ["notebook_path"],
  LS: ["path"],
  Glob: ["pattern", "path"],
  Grep: ["path", "glob"],
};

function motivoParaHerramienta(nombre, datos, contexto) {
  if (!Object.hasOwn(CLAVES_DE_RUTA, nombre)) return null;
  for (const clave of CLAVES_DE_RUTA[nombre]) {
    const valor = datos[clave];
    if (typeof valor !== "string") continue;
    const motivo = motivoParaRuta(valor, contexto, true);
    if (motivo) return motivo;
  }
  return null;
}

// ---------------------------------------------------------------- entrada y salida

/** Carpeta del proyecto: la que da Claude Code, o `cwd`, o el directorio actual. */
export function contextoDe(entrada, entorno = process.env) {
  const base = entorno.CLAUDE_PROJECT_DIR || entrada?.cwd || process.cwd();
  const raiz = resolverReal(path.resolve(base));
  const cwd = entrada?.cwd ? path.resolve(entrada.cwd) : raiz;
  return { raiz, cwd, casa: os.homedir() };
}

/** `null` si la acción está permitida; si no, el motivo por el que se bloquea. */
export function evaluar(entrada, contexto = contextoDe(entrada)) {
  const nombre = entrada?.tool_name;
  const datos = entrada?.tool_input ?? {};
  if (nombre === "Bash") {
    return motivoParaComando(String(datos.command ?? ""), contexto);
  }
  return motivoParaHerramienta(nombre, datos, contexto);
}

export function mensajeDeBloqueo(motivo) {
  return [
    `BLOQUEADO por scripts/ia/bloquear-acciones.mjs: ${motivo}`,
    "Regla: AGENTS.md, «Lo que NO puedes hacer». Si de verdad lo necesitas, pídeselo al usuario.",
    "",
  ].join("\n");
}

async function leerEntrada() {
  const trozos = [];
  for await (const trozo of process.stdin) trozos.push(trozo);
  return Buffer.concat(trozos).toString("utf8");
}

function bloquear(motivo) {
  process.stderr.write(mensajeDeBloqueo(motivo));
  return 2;
}

async function main() {
  let entrada;
  try {
    entrada = JSON.parse(await leerEntrada());
  } catch {
    return bloquear(
      "la entrada del hook no es un JSON válido; por seguridad se bloquea.",
    );
  }
  if (typeof entrada !== "object" || entrada === null) {
    return bloquear(
      "la entrada del hook no es un objeto JSON; por seguridad se bloquea.",
    );
  }
  try {
    const motivo = evaluar(entrada);
    return motivo ? bloquear(motivo) : 0;
  } catch (error) {
    return bloquear(
      `error interno del hook (${error.message}); por seguridad se bloquea.`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = await main();
}
