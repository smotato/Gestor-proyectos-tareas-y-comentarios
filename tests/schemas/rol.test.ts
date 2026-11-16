import { describe, expect, it } from "vitest";
import { ROLES, RolSchema } from "@/schemas/rol";

describe("RolSchema", () => {
  it.each(["propietario", "editor", "lector"])("acepta el rol %s", (rol) => {
    expect(RolSchema.safeParse(rol).success).toBe(true);
  });

  it.each(["admin", "", "Editor", "LECTOR", 1, null])("rechaza %s", (valor) => {
    expect(RolSchema.safeParse(valor).success).toBe(false);
  });

  it("expone la lista de roles", () => {
    expect(ROLES).toEqual(["propietario", "editor", "lector"]);
  });
});
