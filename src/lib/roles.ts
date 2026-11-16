import type { Rol } from "@/schemas/rol";

export const ETIQUETA_ROL: Readonly<Record<Rol, string>> = {
  propietario: "Propietario",
  editor: "Editor",
  lector: "Lector",
};
