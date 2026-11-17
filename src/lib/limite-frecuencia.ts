import { demasiadasSolicitudes, type ErrorHttp } from "./errores";

/**
 * Límite de frecuencia propio: un contador en memoria por IP y ruta.
 * Es por instancia del servidor: en Vercel cada instancia lleva su propia
 * cuenta, así que frena abusos pero no es un límite global exacto.
 */

export interface Regla {
  limite: number;
  ventanaMs: number;
}

export interface Resultado {
  permitido: boolean;
  reintentarEnSeg: number;
}

interface Ventana {
  conteo: number;
  reinicia: number;
}

/** Tope de claves guardadas: evita que muchas IPs distintas llenen la memoria. */
const MAX_CLAVES = 10_000;

export class LimitadorFrecuencia {
  private readonly contadores = new Map<string, Ventana>();
  private readonly reloj: () => number;

  constructor(reloj: () => number = Date.now) {
    this.reloj = reloj;
  }

  /** Cuenta una petición de `clave`; devuelve si pasa y cuántos segundos faltan para el reinicio. */
  consumir(clave: string, regla: Regla): Resultado {
    const ahora = this.reloj();
    this.limpiar(ahora);
    const actual = this.contadores.get(clave);
    const ventana =
      actual && actual.reinicia > ahora
        ? actual
        : { conteo: 0, reinicia: ahora + regla.ventanaMs };
    ventana.conteo += 1;
    this.contadores.set(clave, ventana);
    const faltanMs = ventana.reinicia - ahora;
    return {
      permitido: ventana.conteo <= regla.limite,
      reintentarEnSeg: Math.max(1, Math.ceil(faltanMs / 1000)),
    };
  }

  get tamano(): number {
    return this.contadores.size;
  }

  reiniciar(): void {
    this.contadores.clear();
  }

  /** Al llegar al tope borra las ventanas vencidas y, si no basta, las más antiguas. */
  private limpiar(ahora: number): void {
    if (this.contadores.size < MAX_CLAVES) return;
    for (const [clave, ventana] of this.contadores) {
      if (ventana.reinicia <= ahora) this.contadores.delete(clave);
    }
    for (const clave of this.contadores.keys()) {
      if (this.contadores.size < MAX_CLAVES) break;
      this.contadores.delete(clave);
    }
  }
}

const MINUTO_MS = 60_000;
/** Inicio de sesión y aceptar invitaciones: 10 por minuto (frena adivinar contraseñas o códigos). */
const REGLA_ESTRICTA: Regla = { limite: 10, ventanaMs: MINUTO_MS };
/** Cualquier otra ruta de escritura: 60 por minuto. */
const REGLA_ESCRITURA: Regla = { limite: 60, ventanaMs: MINUTO_MS };

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Segmentos fijos de la API; cualquier otro (un id, un código) cuenta como `:id`. */
const SEGMENTOS_FIJOS = new Set([
  "api",
  "auth",
  "sesion",
  "yo",
  "proyectos",
  "miembros",
  "tareas",
  "comentarios",
  "actividad",
  "invitaciones",
  "aceptar",
]);

/**
 * `/api/proyectos/abc/tareas/xyz` → `/api/proyectos/:id/tareas/:id`.
 * Así cambiar el id en la URL no da un contador nuevo.
 */
export function rutaNormalizada(pathname: string): string {
  const segmentos = pathname
    .split("/")
    .filter((segmento) => segmento !== "")
    .map((segmento) => (SEGMENTOS_FIJOS.has(segmento) ? segmento : ":id"));
  return `/${segmentos.join("/")}`;
}

/** `null` si la ruta no se limita (las lecturas). */
export function reglaPara(metodo: string, ruta: string): Regla | null {
  if (ruta.startsWith("/api/auth/") || ruta.endsWith("/aceptar")) {
    return REGLA_ESTRICTA;
  }
  return METODOS_SEGUROS.has(metodo) ? null : REGLA_ESCRITURA;
}

/**
 * IP del cliente según la plataforma (`x-forwarded-for`). Fuera de Vercel u otro
 * proxy de confianza ese encabezado lo puede escribir el cliente.
 */
export function ipDe(request: Request): string {
  const reenviada = request.headers.get("x-forwarded-for")?.split(",")[0];
  const ip = reenviada?.trim() || request.headers.get("x-real-ip")?.trim();
  return (ip || "desconocida").slice(0, 64);
}

export const limitador = new LimitadorFrecuencia();

/** El error 429 si esta IP superó el límite de la ruta; `null` si puede pasar. */
export function revisarLimite(request: Request): ErrorHttp | null {
  const ruta = rutaNormalizada(new URL(request.url).pathname);
  const regla = reglaPara(request.method, ruta);
  if (!regla) return null;
  const clave = `${ipDe(request)} ${ruta}`;
  const { permitido, reintentarEnSeg } = limitador.consumir(clave, regla);
  return permitido ? null : demasiadasSolicitudes(reintentarEnSeg);
}
