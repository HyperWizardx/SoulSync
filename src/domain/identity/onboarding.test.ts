// Pruebas de la primera vez: misión inicial sugerida y nombre de héroe conocido.
import { describe, expect, it } from "vitest";
import { estimateMinutes, missionCategory } from "@/domain/gamification/missionsData";
import { isAffine } from "./archetype";
import { firstMissionFor, knownHeroName, ONBOARDING_STEPS } from "./onboarding";

describe("primera misión", () => {
  it("es corta, sin requisitos ni cámara, y propia o afín a cada arquetipo", () => {
    for (const a of [0, 1, 2, 3]) {
      const m = firstMissionFor(a)!;
      expect(m).toBeTruthy();
      expect(m.requiredLevel ?? 0).toBe(0);
      expect(m.isAR ?? false).toBe(false);
      expect(m.path).toBeUndefined();
      expect(estimateMinutes(m)).toBeLessThanOrEqual(2);
      expect(m.archetype === a || isAffine(a, missionCategory(m))).toBe(true);
      expect(m.archetype === undefined || m.archetype === a).toBe(true);
    }
  });
  it("es estable y también existe sin arquetipo", () => {
    expect(firstMissionFor(1)!.id).toBe(firstMissionFor(1)!.id);
    expect(firstMissionFor(null)).toBeTruthy();
  });
  it("reconoce el nombre del registro y descarta el nombre por defecto", () => {
    expect(knownHeroName("  Valentina ")).toBe("Valentina");
    expect(knownHeroName("Héroe")).toBe("");
    expect(knownHeroName(null)).toBe("");
    expect(ONBOARDING_STEPS).toHaveLength(3);
  });
});
