import { z } from "zod";

/** Ids de documentos que genera Firestore (sin `/` ni `.`). */
export const ID_DOCUMENTO = /^[A-Za-z0-9_-]{1,64}$/;

/** `?limite=20&cursor=<id>` de las listas paginadas (sección 9.2). */
export const ConsultaListaSchema = z.strictObject({
  limite: z.coerce
    .number()
    .int("El límite debe ser un número entero")
    .min(1, "El límite mínimo es 1")
    .max(100, "El límite máximo es 100")
    .default(20),
  cursor: z.string().regex(ID_DOCUMENTO, "Cursor inválido").optional(),
});

export type ConsultaLista = z.infer<typeof ConsultaListaSchema>;
