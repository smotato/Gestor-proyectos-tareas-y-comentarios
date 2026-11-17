import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { limitador } from "@/lib/limite-frecuencia";

// Cada prueba empieza con los contadores de frecuencia en cero.
beforeEach(() => {
  limitador.reiniciar();
});

// Sin `globals: true`, Testing Library no limpia el DOM sola entre pruebas.
afterEach(() => {
  cleanup();
});
