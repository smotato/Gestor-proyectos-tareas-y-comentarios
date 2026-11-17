/**
 * Reglas de rutas del hook (scripts/ia/bloquear-acciones.mjs): `.env*` y
 * carpeta del proyecto. Se usa tanto para las herramientas de archivos como
 * para las palabras de un comando de Bash.
 */
import fs from "node:fs";
import path from "node:path";

const DISPOSITIVOS = new Set([
  "/dev/null",
  "/dev/stdin",
  "/dev/stdout",
  "/dev/stderr",
  "/dev/tty",
]);

/** Cualquier segmento que empiece por `.env` (`.env`, `.env.local`, `.envrc`…). */
function tocaEnv(ruta) {
  return ruta.split(/[\\/]+/).some((segmento) => segmento.startsWith(".env"));
}

/** Expande `~`, `$HOME`, `$PWD` y `$CLAUDE_PROJECT_DIR` al principio de una ruta. */
function expandirVariables(ruta, contexto) {
  const valores = {
    HOME: contexto.casa,
    PWD: contexto.cwd,
    CLAUDE_PROJECT_DIR: contexto.raiz,
  };
  const conCasa =
    ruta === "~" || ruta.startsWith("~/")
      ? contexto.casa + ruta.slice(1)
      : ruta;
  const patron = /^\$\{?(HOME|PWD|CLAUDE_PROJECT_DIR)\}?(?=\/|$)/;
  return conCasa.replace(patron, (_, nombre) => valores[nombre]);
}

function estaDentro(raiz, destino) {
  const relativa = path.relative(raiz, destino);
  if (relativa === "") return true;
  const sale = relativa === ".." || relativa.startsWith(`..${path.sep}`);
  return !sale && !path.isAbsolute(relativa);
}

/** Resuelve enlaces simbólicos de la parte que ya existe (el resto puede no existir aún). */
export function resolverReal(destino) {
  let actual = destino;
  const resto = [];
  while (!fs.existsSync(actual) && actual !== path.dirname(actual)) {
    resto.unshift(path.basename(actual));
    actual = path.dirname(actual);
  }
  try {
    return path.join(fs.realpathSync(actual), ...resto);
  } catch {
    return destino;
  }
}

function nombresEnLaRaiz() {
  try {
    return new Set(fs.readdirSync("/"));
  } catch {
    return new Set();
  }
}

/**
 * En un comando de Bash no toda palabra es una ruta (`/api/x` puede ser un
 * patrón de grep). Cuenta como ruta la que empieza por `~` o `$HOME`, la que
 * tiene un segmento `..`, y la absoluta cuyo primer tramo existe en `/`.
 */
function pareceRutaReal(palabra, absoluta) {
  if (/^(~|\$\{?(HOME|PWD|CLAUDE_PROJECT_DIR)\}?)(\/|$)/.test(palabra)) {
    return true;
  }
  if (palabra.split("/").includes("..")) return true;
  if (!palabra.startsWith("/")) return false;
  const primero = absoluta.split("/")[1] ?? "";
  return primero === "" || nombresEnLaRaiz().has(primero);
}

/**
 * `estricta` = una herramienta de archivos (Read, Write…): cualquier ruta fuera
 * del proyecto se bloquea. Si no, es una palabra de un comando de Bash.
 */
export function motivoParaRuta(valor, contexto, estricta) {
  if (tocaEnv(valor)) {
    return `no se pueden leer ni tocar archivos .env* (${valor}).`;
  }
  if (DISPOSITIVOS.has(valor)) return null;
  if (!estricta && /\s/.test(valor)) return null;
  const expandida = expandirVariables(valor, contexto);
  if (/^\$\{?\w+\}?\//.test(expandida)) {
    return `la ruta ${valor} usa una variable que no puedo comprobar: usa una ruta relativa al proyecto.`;
  }
  const absoluta = path.resolve(contexto.cwd, expandida);
  if (estaDentro(contexto.raiz, resolverReal(absoluta))) return null;
  if (!estricta && !pareceRutaReal(valor, absoluta)) return null;
  return `la ruta ${valor} queda fuera de la carpeta del proyecto (${contexto.raiz}).`;
}
