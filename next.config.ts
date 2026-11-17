import type { NextConfig } from "next";

/** Hosts que usa Firebase Auth en el navegador (correo y contraseña). */
const HOSTS_FIREBASE_AUTH = [
  "https://identitytoolkit.googleapis.com",
  "https://securetoken.googleapis.com",
  "https://www.googleapis.com",
];

/** Solo fuera de producción: emuladores de Firebase y la recarga en caliente. */
const HOSTS_DESARROLLO = [
  "http://127.0.0.1:9099",
  "http://localhost:9099",
  "ws://localhost:*",
  "ws://127.0.0.1:*",
];

/**
 * Content-Security-Policy básica, sin nonces (la variante de la guía de Next).
 * Next necesita scripts y estilos en línea para hidratar la página, por eso
 * `'unsafe-inline'`; en desarrollo React además usa `eval`.
 */
function politicaDeContenido(produccion: boolean): string {
  const conexiones = [
    "'self'",
    ...HOSTS_FIREBASE_AUTH,
    ...(produccion ? [] : HOSTS_DESARROLLO),
  ];
  const evalDeReact = produccion ? "" : " 'unsafe-eval'";
  const directivas = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${evalDeReact}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${conexiones.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(produccion ? ["upgrade-insecure-requests"] : []),
  ];
  return directivas.join("; ");
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    const produccion = process.env.NODE_ENV === "production";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: politicaDeContenido(produccion),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
