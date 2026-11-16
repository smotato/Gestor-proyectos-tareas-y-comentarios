import {
  type FiltrosTareas,
  FiltrosTareasSchema,
} from "@/schemas/consulta-tareas";

type Parametros = Record<string, string | string[] | undefined>;

const CLAVES: readonly (keyof FiltrosTareas)[] = [
  "estado",
  "responsable",
  "mias",
];

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/**
 * Filtros válidos de la URL. Los parámetros vacíos (un formulario GET los envía)
 * se ignoran y, si alguno es inválido, no se aplica ninguno.
 */
export function leerFiltros(parametros: Parametros): FiltrosTareas {
  const candidato: Record<string, string> = {};
  for (const clave of CLAVES) {
    const valor = primero(parametros[clave]);
    if (valor) candidato[clave] = valor;
  }
  const resultado = FiltrosTareasSchema.safeParse(candidato);
  return resultado.success ? resultado.data : {};
}

export function urlConFiltros(ruta: string, filtros: FiltrosTareas): string {
  const parametros = new URLSearchParams();
  for (const clave of CLAVES) {
    const valor = filtros[clave];
    if (valor) parametros.set(clave, valor);
  }
  const consulta = parametros.toString();
  return consulta ? `${ruta}?${consulta}` : ruta;
}
