import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { EnlacesInvitado, MenuSesion } from "@/components/MenuSesion";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Gestor de proyectos",
    template: "%s · Gestor de proyectos",
  },
  description:
    "Proyectos con miembros, tareas asignadas, estados y comentarios, con permisos por rol.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a href="#contenido" className="saltar">
          Saltar al contenido
        </a>
        <header className="encabezado">
          <Link href="/" className="encabezado__marca">
            Gestor de proyectos
          </Link>
          <nav aria-label="Principal">
            <Suspense fallback={<EnlacesInvitado />}>
              <MenuSesion />
            </Suspense>
          </nav>
        </header>
        <main id="contenido" tabIndex={-1} className="contenido">
          {children}
        </main>
        <footer className="pie">
          <p>Gestor de proyectos · Proyecto de clase</p>
        </footer>
      </body>
    </html>
  );
}
