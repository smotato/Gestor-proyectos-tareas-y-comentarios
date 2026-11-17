/**
 * Pruebas del hook PreToolUse (`npm run test:hook`, con `node:test`).
 *
 * Cada prueba lanza el script de verdad como lo hace Claude Code: le manda el
 * JSON por stdin y comprueba el código de salida (2 = bloquear, 0 = permitir)
 * y el mensaje de stderr. La carpeta «del proyecto» es una ruta de mentira que
 * no necesita existir.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(
  new URL("./bloquear-acciones.mjs", import.meta.url),
);
const RAIZ = "/tmp/proyecto-de-prueba";

/** Cómo se llama la clave de `tool_input` que lleva la ruta, por herramienta. */
const CLAVES = {
  Read: "file_path",
  Write: "file_path",
  Edit: "file_path",
  NotebookEdit: "notebook_path",
  "Glob:pattern": "pattern",
  "Glob:path": "path",
  "Grep:path": "path",
  "Grep:glob": "glob",
};

// ---------------------------------------------------------------- casos

const PARES_CON_ENV = [
  ["Read", ".env"],
  ["Read", "/tmp/proyecto-de-prueba/.env.local"],
  ["Read", "apps/web/.env.production"],
  ["Read", ".env.example"],
  ["Write", ".env"],
  ["Edit", "./.env.test"],
  ["Glob:pattern", "**/.env*"],
  ["Grep:glob", ".env*"],
  ["Grep:path", ".env.local"],
  ["Glob:path", "/tmp/proyecto-de-prueba/.env"],
];

const COMANDOS_CON_ENV = [
  "cat .env",
  "cat ./.env.local",
  "source .env",
  "grep SECRET .env.production",
  "head -n 2 .env*",
  "cat src/../.env",
  "echo $(cat .env)",
  'bash -c "cat .env"',
  "npm run build --env-file=.env",
  "cat .env > /dev/null",
  "less .envrc",
];

const PARES_FUERA = [
  ["Read", "/etc/passwd"],
  ["Read", "/home/otro/.ssh/id_rsa"],
  ["Write", "/etc/hosts"],
  ["Edit", "/usr/local/bin/script.sh"],
  ["Read", "../otro-proyecto/secreto.txt"],
  ["Read", "src/../../etc/passwd"],
  ["NotebookEdit", "/tmp/otro/cuaderno.ipynb"],
  ["Glob:path", "/mnt/c"],
  ["Grep:path", "/var/log"],
  ["Read", "~/.bashrc"],
  ["Glob:pattern", "/etc/**"],
  ["Read", "/tmp/proyecto-de-prueba-hermano/x.txt"],
];

const COMANDOS_FUERA = [
  "cat /etc/passwd",
  "ls /usr/lib",
  "cp src/x.ts /tmp/x.ts",
  "echo hola > /etc/motd",
  "cat ~/.ssh/id_rsa",
  "ls $HOME",
  "cat ${HOME}/.bashrc",
  "cd ..",
  "ls ../..",
  "tar czf /root/x.tgz .",
  "cat src/../../etc/passwd",
  "sort --output=/var/x src/a.txt",
  "cat $TMPDIR/x",
  "ls /",
  "grep -r algo ~",
];

const COMANDOS_DE_RED = [
  "curl https://ejemplo.com",
  "wget http://ejemplo.com/a.zip",
  "sudo apt install x",
  "/usr/bin/curl -s https://ejemplo.com",
  "\\curl https://ejemplo.com",
  "curl -X POST https://api.ejemplo.com -d @src/x.json",
];

const COMANDOS_DE_RED_ESCONDIDOS = [
  "ls && curl https://ejemplo.com",
  "echo $(wget http://ejemplo.com)",
  'bash -c "curl https://ejemplo.com"',
  "env FOO=1 curl https://ejemplo.com",
  "xargs sudo rm x",
  "echo `curl https://ejemplo.com`",
  "cat x | sudo tee y",
  "timeout 5 wget http://ejemplo.com",
  'eval "sudo ls"',
  'sh -lc "wget http://ejemplo.com"',
  "git status; sudo reboot",
  'echo "$(curl https://ejemplo.com)"',
  "time curl https://ejemplo.com",
  "nice -n 5 curl https://ejemplo.com",
  "(curl https://ejemplo.com)",
];

const PARES_PERMITIDOS = [
  ["Read", "/tmp/proyecto-de-prueba/src/app/page.tsx"],
  ["Read", "src/app/page.tsx"],
  ["Write", "/tmp/proyecto-de-prueba/README.md"],
  ["Edit", "tests/api/x.test.ts"],
  ["Glob:pattern", "src/**/*.tsx"],
  ["Glob:pattern", "**/*.ts"],
  ["Grep:path", "src"],
  ["Grep:glob", "*.test.ts"],
  ["Read", "src/../package.json"],
  ["NotebookEdit", "docs/cuaderno.ipynb"],
  ["Read", "/tmp/proyecto-de-prueba"],
];

const COMANDOS_PERMITIDOS = [
  "npm run check",
  "git status",
  "git diff --stat",
  "git log --oneline -5",
  "ls -la src",
  "cat package.json",
  "cat src/../package.json",
  "node scripts/ia/bloquear-acciones.mjs",
  "cd /tmp/proyecto-de-prueba/src && ls",
  'grep -rn "/api/proyectos" src',
  "cat package.json > /dev/null",
  "npm run lint 2>/dev/null",
  "echo hola | wc -c",
  'git commit -m "no usar curl ni leer .env"',
  "echo curl wget sudo",
  "grep -rn curl docs",
  "mkdir -p src/nueva && touch src/nueva/a.ts",
  "FOO=bar npm run build",
  "npx vitest run tests/api",
  "git diff -- src/lib",
  'echo "ruta: /etc/passwd es un ejemplo"',
  "node_modules/.bin/vitest run",
  "ls .github",
];

const HERRAMIENTAS_SIN_RUTAS = [
  "WebSearch",
  "TodoWrite",
  "Agent",
  "constructor",
  "__proto__",
  "toString",
];

// ---------------------------------------------------------------- ayudas

/** Lanza el hook como Claude Code: JSON por stdin y devuelve código, stdout y stderr. */
function ejecutar(entrada, { cwd = RAIZ, entorno = {} } = {}) {
  const texto =
    typeof entrada === "string"
      ? entrada
      : JSON.stringify({ hook_event_name: "PreToolUse", cwd, ...entrada });
  const resultado = spawnSync(process.execPath, [SCRIPT], {
    input: texto,
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: RAIZ, ...entorno },
  });
  return {
    codigo: resultado.status,
    stdout: resultado.stdout,
    stderr: resultado.stderr,
  };
}

const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });

const herramienta = ([nombre, valor]) => ({
  tool_name: nombre.split(":")[0],
  tool_input: { [CLAVES[nombre]]: valor },
});

function debeBloquear(entrada, descripcion, opciones) {
  const resultado = ejecutar(entrada, opciones);
  assert.equal(resultado.codigo, 2, `debía bloquear: ${descripcion}`);
  assert.match(resultado.stderr, /BLOQUEADO/, descripcion);
  return resultado;
}

function debePermitir(entrada, descripcion, opciones) {
  const resultado = ejecutar(entrada, opciones);
  const detalle = `debía permitir: ${descripcion}\n${resultado.stderr}`;
  assert.equal(resultado.codigo, 0, detalle);
  assert.equal(resultado.stderr, "", detalle);
}

// ---------------------------------------------------------------- pruebas

test("1. bloquea archivos .env* en las herramientas de archivos", () => {
  for (const par of PARES_CON_ENV) {
    const resultado = debeBloquear(herramienta(par), par.join(" "));
    assert.match(resultado.stderr, /\.env/);
  }
});

test("2. bloquea archivos .env* en comandos de Bash", () => {
  for (const comando of COMANDOS_CON_ENV) {
    const resultado = debeBloquear(bash(comando), comando);
    assert.match(resultado.stderr, /\.env/, comando);
  }
});

test("3. bloquea rutas fuera del proyecto en las herramientas de archivos", () => {
  for (const par of PARES_FUERA) {
    const resultado = debeBloquear(herramienta(par), par.join(" "));
    assert.match(resultado.stderr, /fuera de la carpeta del proyecto/);
  }
});

test("4. bloquea rutas fuera del proyecto en comandos de Bash", () => {
  for (const comando of COMANDOS_FUERA) debeBloquear(bash(comando), comando);
});

test("5. bloquea curl, wget y sudo", () => {
  for (const comando of COMANDOS_DE_RED) {
    const resultado = debeBloquear(bash(comando), comando);
    assert.match(resultado.stderr, /curl|wget|sudo/, comando);
  }
});

test("6. bloquea curl, wget y sudo escondidos en otros comandos", () => {
  for (const comando of COMANDOS_DE_RED_ESCONDIDOS) {
    const resultado = debeBloquear(bash(comando), comando);
    assert.match(resultado.stderr, /curl|wget|sudo/, comando);
  }
});

test("7. permite trabajar con archivos dentro del proyecto", () => {
  for (const par of PARES_PERMITIDOS)
    debePermitir(herramienta(par), par.join(" "));
});

test("8. permite los comandos normales del proyecto (sin falsos positivos)", () => {
  for (const comando of COMANDOS_PERMITIDOS)
    debePermitir(bash(comando), comando);
});

test("9. deja pasar las herramientas que no tocan archivos ni comandos", () => {
  for (const nombre of HERRAMIENTAS_SIN_RUTAS) {
    const entrada = {
      tool_name: nombre,
      tool_input: { query: "cómo usar curl" },
    };
    debePermitir(entrada, nombre);
  }
});

test("10. falla cerrado: una entrada que no es JSON se bloquea", () => {
  for (const texto of ["", "esto no es json", "{", "null", "42"]) {
    const resultado = ejecutar(texto);
    assert.equal(resultado.codigo, 2, `entrada: ${JSON.stringify(texto)}`);
    assert.match(resultado.stderr, /JSON/);
  }
});

test("11. el mensaje de bloqueo dice qué pasó y apunta a AGENTS.md", () => {
  const resultado = debeBloquear(herramienta(["Read", "/etc/passwd"]), "Read");
  assert.equal(resultado.codigo, 2);
  assert.match(resultado.stderr, /\/etc\/passwd/);
  assert.match(resultado.stderr, /AGENTS\.md/);
  assert.equal(resultado.stdout, "");
});

test("12. las rutas relativas se miden desde cwd, y sin CLAUDE_PROJECT_DIR el proyecto es cwd", () => {
  const dentro = { cwd: `${RAIZ}/src` };
  debePermitir(
    bash("cat ../package.json"),
    "../package.json desde src",
    dentro,
  );
  debeBloquear(bash("cat ../../x.txt"), "../../x.txt desde src", dentro);
  const sinVariable = { entorno: { CLAUDE_PROJECT_DIR: undefined } };
  debePermitir(bash("cat src/a.ts"), "ruta relativa", sinVariable);
  debeBloquear(bash("cat /etc/passwd"), "ruta absoluta", sinVariable);
});
