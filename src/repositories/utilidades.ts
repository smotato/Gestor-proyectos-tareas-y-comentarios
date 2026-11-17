import type {
  CollectionReference,
  DocumentData,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

export interface Pagina<T> {
  items: T[];
  siguienteCursor: string | null;
}

/** Los datos de un documento sin su `id` (el id es el del documento). */
export function sinId(objeto: { id: string }): DocumentData {
  return Object.fromEntries(
    Object.entries(objeto).filter(([campo]) => campo !== "id"),
  );
}

/** Continúa la consulta después del documento `cursor`, si existe. */
export async function despuesDe(
  consulta: Query,
  coleccion: CollectionReference,
  cursor: string | undefined,
): Promise<Query> {
  if (!cursor) return consulta;
  const ultimo = await coleccion.doc(cursor).get();
  return ultimo.exists ? consulta.startAfter(ultimo) : consulta;
}

/** Lee una página: pide uno más para saber si hay siguiente. */
export async function paginar<T>(
  consulta: Query,
  limite: number,
  aItem: (doc: QueryDocumentSnapshot) => T,
): Promise<Pagina<T>> {
  const snap = await consulta.limit(limite + 1).get();
  const docs = snap.docs.slice(0, limite);
  const hayMas = snap.docs.length > limite;
  return {
    items: docs.map(aItem),
    siguienteCursor: hayMas ? (docs.at(-1)?.id ?? null) : null,
  };
}
