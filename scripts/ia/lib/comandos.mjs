/**
 * Análisis de comandos de Bash para el hook (scripts/ia/bloquear-acciones.mjs).
 * No es un intérprete de shell: separa comandos y palabras respetando comillas y
 * mira `curl`, `wget`, `sudo`, `.env*` y las rutas de cada palabra.
 */
import path from "node:path";
import { motivoParaRuta } from "./rutas.mjs";

const COMANDOS_PROHIBIDOS = new Set(["curl", "wget", "sudo"]);
const ENVOLTORIOS = new Set([
  "env",
  "command",
  "exec",
  "nohup",
  "time",
  "nice",
  "timeout",
  "xargs",
  "setsid",
  "builtin",
]);
const INTERPRETES = new Set(["bash", "sh", "zsh", "dash"]);
const SEPARADORES = new Set([";", "&", "|", "\n", "(", ")", "`"]);
const PROFUNDIDAD_MAXIMA = 4;

// ---------------------------------------------------------------- Bash

function nuevoEstado() {
  return { segmentos: [[]], palabra: null, comilla: null };
}

function agregar(estado, texto) {
  estado.palabra = (estado.palabra ?? "") + texto;
}

function cerrarPalabra(estado) {
  if (estado.palabra === null) return;
  estado.segmentos.at(-1).push(estado.palabra);
  estado.palabra = null;
}

function procesarLibre(estado, c) {
  if (c === "'" || c === '"') {
    estado.comilla = c;
    agregar(estado, "");
  } else if (c === " " || c === "\t") {
    cerrarPalabra(estado);
  } else if (SEPARADORES.has(c)) {
    cerrarPalabra(estado);
    estado.segmentos.push([]);
  } else {
    agregar(estado, c);
  }
}

function procesarEntreComillas(estado, c) {
  if (c === estado.comilla) estado.comilla = null;
  else agregar(estado, c);
}

/**
 * Divide un comando en comandos simples (separados por `;`, `&&`, `|`, saltos
 * de línea o paréntesis) y cada uno en palabras, sin las comillas.
 */
function analizar(comando) {
  const estado = nuevoEstado();
  for (let i = 0; i < comando.length; i += 1) {
    const c = comando[i];
    if (c === "\\" && estado.comilla !== "'") {
      agregar(estado, comando[i + 1] ?? "");
      i += 1;
    } else if (estado.comilla === null) {
      procesarLibre(estado, c);
    } else {
      procesarEntreComillas(estado, c);
    }
  }
  cerrarPalabra(estado);
  return estado.segmentos.filter((palabras) => palabras.length > 0);
}

/** Posición del `)` que cierra un `$(` cuyo contenido empieza en `desde`. */
function cerrarParentesis(texto, desde) {
  let nivel = 1;
  for (let i = desde; i < texto.length; i += 1) {
    if (texto[i] === "(") nivel += 1;
    if (texto[i] === ")") nivel -= 1;
    if (nivel === 0) return i;
  }
  return texto.length;
}

/** Texto dentro de `$(…)` y de comillas invertidas, también dentro de comillas dobles. */
function sustituciones(comando) {
  const sinLiterales = comando.replace(/'[^']*'/g, "''");
  const internos = [...sinLiterales.matchAll(/`([^`]*)`/g)].map((m) => m[1]);
  let inicio = sinLiterales.indexOf("$(");
  while (inicio !== -1) {
    const fin = cerrarParentesis(sinLiterales, inicio + 2);
    internos.push(sinLiterales.slice(inicio + 2, fin));
    inicio = sinLiterales.indexOf("$(", inicio + 2);
  }
  return internos;
}

function esAsignacion(palabra) {
  return /^[A-Za-z_]\w*=/.test(palabra);
}

/** Salta asignaciones (`FOO=1`) y envoltorios (`env`, `time`, `xargs`…) hasta el comando real. */
function comandoReal(palabras) {
  let i = 0;
  let envuelto = false;
  while (i < palabras.length) {
    const palabra = palabras[i];
    if (esAsignacion(palabra) || (envuelto && /^(-|\d+$)/.test(palabra))) {
      i += 1;
    } else if (ENVOLTORIOS.has(path.basename(palabra))) {
      envuelto = true;
      i += 1;
    } else {
      break;
    }
  }
  return palabras.slice(i);
}

/** El texto que ejecuta `bash -c "…"` o `eval …`; `null` si no es ninguno. */
function textoInterpretado(nombre, real) {
  if (nombre === "eval") return real.slice(1).join(" ");
  if (!INTERPRETES.has(nombre)) return null;
  const indice = real.findIndex((palabra) => /^-[a-z]*c[a-z]*$/.test(palabra));
  return indice === -1 ? null : (real[indice + 1] ?? null);
}

function motivoParaComandoReal(palabras, contexto, profundidad) {
  const real = comandoReal(palabras);
  if (real.length === 0) return null;
  const nombre = path.basename(real[0]);
  if (COMANDOS_PROHIBIDOS.has(nombre)) {
    return `el comando ${nombre} está prohibido (ni red ni privilegios de administrador).`;
  }
  const interior = textoInterpretado(nombre, real);
  if (interior === null) return null;
  return motivoParaComando(interior, contexto, profundidad + 1);
}

/** Quita `>`/`2>`/`<` del principio y, en `--opcion=valor`, se queda con el valor. */
function valorDePalabra(palabra) {
  const sinRedireccion = palabra.replace(/^\d*[<>]+/, "");
  if (!sinRedireccion.startsWith("-")) return sinRedireccion;
  const igual = sinRedireccion.indexOf("=");
  return igual === -1 ? sinRedireccion : sinRedireccion.slice(igual + 1);
}

function motivoParaPalabras(palabras, contexto) {
  for (const palabra of palabras) {
    const motivo = motivoParaRuta(valorDePalabra(palabra), contexto, false);
    if (motivo) return motivo;
  }
  return null;
}

export function motivoParaComando(comando, contexto, profundidad = 0) {
  if (profundidad > PROFUNDIDAD_MAXIMA) return null;
  for (const palabras of analizar(comando)) {
    const motivo =
      motivoParaPalabras(palabras, contexto) ??
      motivoParaComandoReal(palabras, contexto, profundidad);
    if (motivo) return motivo;
  }
  for (const interior of sustituciones(comando)) {
    const motivo = motivoParaComando(interior, contexto, profundidad + 1);
    if (motivo) return motivo;
  }
  return null;
}
