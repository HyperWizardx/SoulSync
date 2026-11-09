// Verifica las etiquetas de recompensa que vuelan al completar una misión.
import { describe, expect, it } from "vitest";
import { rewardChips } from "./feedback";

describe("Recompensa al completar", () => {
  it("muestra XP, monedas y gemas en ese orden", () => {
    expect(rewardChips({ xp: 50, coins: 20, gems: 1 }).map((c) => c.label)).toEqual(["+50 XP", "+20", "+1"]);
  });
  it("omite lo que vale cero", () => {
    expect(rewardChips({ xp: 30, coins: 0, gems: 0 }).map((c) => c.kind)).toEqual(["xp"]);
  });
});
