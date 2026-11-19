import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { MarcoApp } from "@/components/app/MarcoApp";
import { MenuLateral, MenuLateralCargando } from "@/components/app/MenuLateral";
import { metadatosDelSitio } from "@/lib/seo";
import "./globals.css";
import "./ui.css";
import "./app-shell.css";
import "./invitaciones.css";
import "./proyectos.css";
import "./tareas.css";
import "./contraste.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = metadatosDelSitio();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={geistSans.variable}>
      <body>
        <a href="#contenido" className="saltar">
          Saltar al contenido
        </a>
        <MarcoApp
          menu={
            <Suspense fallback={<MenuLateralCargando />}>
              <MenuLateral />
            </Suspense>
          }
        >
          {children}
        </MarcoApp>
      </body>
    </html>
  );
}
