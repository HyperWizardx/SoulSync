/** Pruebas del caso de uso "Completar misión" (sin base de datos). */
import { describe, expect, it } from "vitest";
import { planMissionCompletion, type PlayerState } from "./completeMission";

const now = Date.parse("2026-10-20T12:00:00Z");
const state: PlayerState = {
  xp: 550, level: 2, coins: 100, gems: 5, streak: 3, lastMissionDate: "2026-10-19",
  stats: { bienestar: 50, resiliencia: 50, energia: 50, claridad: 50 },
  attributes: { resiliencia: 30, empatia: 30, mindfulness: 30, autoconocimiento: 30, conexion_social: 30, creatividad: 30 },
};
const reward = { xp: 100, coins: 10, gems: 1, stats: { bienestar: 5 }, attributes: { empatia: 4 } };

describe("completar misión", () => {
  it("suma recompensas, sube de nivel y continúa la racha", () => {
    const r = planMissionCompletion(state, reward, [], [], now);
    expect(r.profile).toMatchObject({ xp: 50, level: 3, streak: 4, coins: 110, gems: 6, last_mission_date: "2026-10-20" });
    expect(r.leveledUp).toBe(true);
    expect(r.stats.bienestar).toBe(55);
    expect(r.attributes.empatia).toBe(34);
  });
  it("un multiplicador de XP activo duplica la XP ganada", () => {
    const fx = [{ id: "e1", item_key: "x", effect: "xp_multiplier", magnitude: 2, uses_left: 1 }];
    const r = planMissionCompletion(state, reward, fx, [], now);
    expect(r.gainedXp).toBe(200);
    expect(r.effectsToConsume.map((e) => e.id)).toEqual(["e1"]);
  });
  it("el escudo no se consume si la racha no estaba en riesgo", () => {
    const fx = [{ id: "s1", item_key: "x", effect: "streak_shield", magnitude: 1, uses_left: 1 }];
    expect(planMissionCompletion(state, reward, fx, [], now).effectsToConsume).toEqual([]);
  });
});
