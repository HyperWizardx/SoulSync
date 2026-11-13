// Verifica que cada indicador de la brújula apunte a una misión real y siempre disponible.
import { describe, expect, it } from "vitest";
import { FACTOR_MISSION } from "./factorActions";
import { getMissionById } from "@/domain/gamification/missionsData";

describe("Misiones del ¿Por qué? de la brújula", () => {
  it("cada misión existe y no exige nivel, ruta ni arquetipo", () => {
    for (const [key, id] of Object.entries(FACTOR_MISSION)) {
      if (id === null) { expect(key).toBe("scaleDistress"); continue; }
      const m = getMissionById(id);
      expect(m, `${key} → ${id}`).toBeDefined();
      expect(m?.requiredLevel ?? 0).toBeLessThanOrEqual(1);
      expect(m?.path).toBeUndefined();
      expect(m?.archetype).toBeUndefined();
      expect(m?.isAR).toBeFalsy();
    }
  });
});
