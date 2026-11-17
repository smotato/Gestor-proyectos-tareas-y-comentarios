import { ErrorHttp } from "@/lib/errores";

/** Ejecuta `accion` y devuelve el ErrorHttp que lanza; falla si no lanza ninguno. */
export function capturarErrorHttp(accion: () => unknown): ErrorHttp {
  try {
    accion();
  } catch (error) {
    if (error instanceof ErrorHttp) return error;
    throw error;
  }
  throw new Error("Se esperaba un ErrorHttp");
}

/** jsdom no implementa `<dialog>.showModal()` ni `.close()`: se simula lo básico. */
export function simularDialogoNativo(): void {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
