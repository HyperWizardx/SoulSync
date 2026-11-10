// Verifica las categorías del catálogo de misiones y de dónde sale cada atributo.
import { describe, expect, it } from "vitest";
import { MISSIONS, attributeSourceCategory, getMissionById, missionCategory, pathBlocker, pathMissions } from "./missionsData";

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

describe("Ruta Hacer lo que importa (OMS)", () => {
  it("tiene 5 pasos en orden", () => {
    expect(pathMissions("dwm").map((m) => m.path?.step)).toEqual([1, 2, 3, 4, 5]);
  });
  it("cada paso se desbloquea al cumplir el anterior", () => {
    expect(pathBlocker(getMissionById("dwm-1")!, new Set())).toBeNull();
    expect(pathBlocker(getMissionById("dwm-2")!, new Set())?.id).toBe("dwm-1");
    expect(pathBlocker(getMissionById("dwm-2")!, new Set(["dwm-1"]))).toBeNull();
    expect(pathBlocker(getMissionById("breath-4")!, new Set())).toBeNull();
  });
});
