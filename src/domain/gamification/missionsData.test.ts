// Verifica las categorías del catálogo de misiones y de dónde sale cada atributo.
import { describe, expect, it } from "vitest";
import { MISSIONS, attributeSourceCategory, getMissionById, missionCategory } from "./missionsData";

describe("Catálogo de misiones", () => {
  it("los ids son únicos", () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
  });
  it("las AR se registran como ar y los temporizadores usan su categoría temática", () => {
    expect(missionCategory(getMissionById("ar-walk")!)).toBe("ar");
    expect(missionCategory(getMissionById("hydrate")!)).toBe("autocuidado");
    expect(missionCategory(getMissionById("focus-sprint")!)).toBe("cognitivo");
    expect(missionCategory(getMissionById("stretch-60")!)).toBe("movimiento");
  });
  it("cada atributo tiene una categoría de misión que lo hace crecer", () => {
    for (const a of ["resiliencia", "empatia", "mindfulness", "autoconocimiento", "conexionSocial", "creatividad"] as const) {
      expect(attributeSourceCategory(a)).not.toBeNull();
    }
    expect(attributeSourceCategory("conexionSocial")).toBe("social");
  });
});
