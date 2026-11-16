import { z } from "zod";
import { MiembrosSchema, UidSchema } from "./miembro";

const NombreProyectoSchema = z
  .string()
  .trim()
  .min(1, "El nombre es obligatorio")
  .max(100, "El nombre admite máximo 100 caracteres");

/** Lo único que el cliente envía al crear un proyecto; el resto lo decide el servidor. */
export const CrearProyectoSchema = z.strictObject({
  nombre: NombreProyectoSchema,
});

export type CrearProyecto = z.infer<typeof CrearProyectoSchema>;

function mismosUids(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const ordenadosB = [...b].sort();
  return [...a].sort().every((uid, i) => uid === ordenadosB[i]);
}

/** Documento `proyectos/{id}` con sus invariantes de membresía. */
export const ProyectoSchema = z
  .strictObject({
    id: z.string().min(1),
    nombre: NombreProyectoSchema,
    propietarioUid: UidSchema,
    miembros: MiembrosSchema,
    miembrosUids: z.array(UidSchema),
    creadoEn: z.iso.datetime(),
  })
  .superRefine((proyecto, ctx) => {
    const roles = Object.values(proyecto.miembros);
    if (!roles.includes("propietario")) {
      ctx.addIssue({
        code: "custom",
        path: ["miembros"],
        message: "El proyecto necesita al menos un propietario",
      });
    }
    if (proyecto.miembros[proyecto.propietarioUid] !== "propietario") {
      ctx.addIssue({
        code: "custom",
        path: ["propietarioUid"],
        message: "propietarioUid debe tener el rol propietario",
      });
    }
    if (!mismosUids(proyecto.miembrosUids, Object.keys(proyecto.miembros))) {
      ctx.addIssue({
        code: "custom",
        path: ["miembrosUids"],
        message: "miembrosUids debe coincidir con las claves de miembros",
      });
    }
  });

export type Proyecto = z.infer<typeof ProyectoSchema>;
