// Verifica las etiquetas de recompensa que vuelan al completar una misión.
import { describe, expect, it } from "vitest";
import { rewardChips, missionCheer, MISSION_BANNER_MS } from "./feedback";

describe("Recompensa al completar", () => {
  it("muestra XP, monedas y gemas en ese orden", () => {
    expect(rewardChips({ xp: 50, coins: 20, gems: 1 }).map((c) => c.label)).toEqual(["+50 XP", "+20", "+1"]);
  });
  it("omite lo que vale cero", () => {
    expect(rewardChips({ xp: 30, coins: 0, gems: 0 }).map((c) => c.kind)).toEqual(["xp"]);
  });
});

describe("Aviso de misión cumplida", () => {
  it("elige una frase motivadora no vacía y estable para la misma semilla", () => {
    expect(missionCheer(0)).toBeTruthy();
    expect(missionCheer(0.5)).toBe(missionCheer(0.5));
    expect(missionCheer(0.999)).toBeTruthy();
  });
  it("dura lo suficiente para leerse sin frenar la aventura", () => {
    expect(MISSION_BANNER_MS).toBeGreaterThanOrEqual(1200);
    expect(MISSION_BANNER_MS).toBeLessThanOrEqual(2500);
  });
});
