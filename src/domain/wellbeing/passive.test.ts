import { describe, expect, it } from "vitest";
import { computePassiveSignals, extractFeatures } from "./features";
import { baselineLogisticModel } from "./baselineLogistic";

const rows = (hours: (number | null)[], secs: (number | null)[] = []) =>
  hours.map((h, i) => ({ date: `2026-10-${String(20 - i).padStart(2, "0")}`, localHour: h, responseSeconds: secs[i] ?? null }));

describe("variables pasivas del check-in", () => {
  it("cuenta la fracción de check-ins de madrugada (00–05 h)", () => {
    const r = rows([1, 2, 22, 23]);
    expect(computePassiveSignals(r, r).lateCheckin).toBe(0.5);
  });
  it("horario constante da irregularidad 0; mezclado da más", () => {
    expect(computePassiveSignals(rows([20, 20, 20]), []).scheduleIrregularity).toBe(0);
    expect(computePassiveSignals(rows([8, 20, 2]), []).scheduleIrregularity!).toBeGreaterThan(0.5);
  });
  it("latencia reciente el doble de la mediana propia da 1", () => {
    const all = rows([null, null, null, null], [20, 20, 20, 20]);
    const recent = rows([null], [40]);
    expect(computePassiveSignals(all, recent).responseLatency).toBe(1);
  });
  it("sin datos pasivos quedan no disponibles y no bajan la cobertura", () => {
    const checkins = [0, 1, 2, 3].map((i) => ({ date: `2026-10-${20 - i}`, mood: 3, stress: 3, energy: 3, social: 3, sleepHours: 7 }));
    const fs = extractFeatures({ today: "2026-10-20", checkins, telemetry: { missionsByDate: {}, dailyGoal: 3, lastMissionDate: "2026-10-20" }, taskEvents: [{ date: "2026-10-20", missionId: "m", status: "completed", category: "autocuidado", durationSeconds: 60 }] });
    expect(fs.features.lateCheckin.available).toBe(false);
    const withPassive = extractFeatures({ today: "2026-10-20", checkins: checkins.map((c) => ({ ...c, localHour: 21 })), telemetry: { missionsByDate: {}, dailyGoal: 3, lastMissionDate: "2026-10-20" }, taskEvents: [{ date: "2026-10-20", missionId: "m", status: "completed", category: "autocuidado", durationSeconds: 60 }] });
    expect(baselineLogisticModel.predict(fs).coverage).toBeGreaterThan(0);
    expect(baselineLogisticModel.predict(withPassive).coverage).toBeGreaterThanOrEqual(baselineLogisticModel.predict(fs).coverage);
  });
});
