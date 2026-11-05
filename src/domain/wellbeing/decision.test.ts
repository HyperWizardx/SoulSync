/** Pruebas del criterio de decisión v4: histéresis, seguridad, protectores, confianza y contexto. */
import { describe, expect, it } from "vitest";
import { applyHysteresis, computePersonalBaseline, decisionModel, evaluateSafetyRules, personalAdjustment, protectiveFactors, signalConfidence, academicAdjustment } from "./decision";
import { suggestMissions } from "./recommendations";
import { isExamPeriod } from "./inference";
import type { CheckinRecord, FeatureKey, FeatureSet } from "./types";

const KEYS: FeatureKey[] = ["moodLow", "moodDecline", "stressHigh", "sleepDeficit", "engagementDrop", "lowAdherence", "socialWithdrawal", "streakBreak", "scaleDistress", "taskSkipRate", "selfcareGap", "lateCheckin", "scheduleIrregularity", "responseLatency"];
function fs(values: Partial<Record<FeatureKey, number>>, checkinCount14 = 8): FeatureSet {
  const features = Object.fromEntries(KEYS.map((k) => [k, { key: k, value: values[k] ?? null, available: values[k] !== undefined }])) as FeatureSet["features"];
  return { featureVersion: "fv4", features, checkinCount14, wellbeingIndex7: 0.5, wellbeingIndexPrev7: 0.5 };
}
const ck = (date: string, mood: number, stress: number): CheckinRecord => ({ date, mood, stress, energy: 3, social: 3 });

describe("Histéresis", () => {
  it("no salta a Alto sin señal elevada previa", () => {
    expect(applyHysteresis("alto", ["bajo"])).toEqual({ level: "moderado", mode: "contenida" });
  });
  it("mantiene Alto si ya venía de Moderado", () => {
    expect(applyHysteresis("alto", ["moderado"]).level).toBe("alto");
  });
  it("baja desde Alto pasando por Moderado", () => {
    expect(applyHysteresis("bajo", ["alto"])).toEqual({ level: "moderado", mode: "sostenida" });
  });
});

describe("Reglas de seguridad", () => {
  it("detecta la tríada estrés + sueño + aislamiento", () => {
    expect(evaluateSafetyRules(fs({ stressHigh: 0.8, sleepDeficit: 0.7, socialWithdrawal: 0.7 }))).toContain("triada_estres_sueno_aislamiento");
  });
  it("detecta escala severa (≥75%)", () => {
    expect(evaluateSafetyRules(fs({ scaleDistress: 0.8 }))).toEqual(["escala_severa"]);
  });
  it("una regla de seguridad fuerza Alto aunque no haya historia previa", () => {
    const p = decisionModel.predict(fs({ moodLow: 0.3, stressHigh: 0.3, lowAdherence: 0.5, streakBreak: 0, scaleDistress: 0.9 }), { previousLevels: [] });
    expect(p.riskLevel).toBe("alto");
  });
});

describe("Ajustes", () => {
  it("cada factor protector resta 0.025, con tope 0.08", () => {
    expect(protectiveFactors(fs({ selfcareGap: 0.1 })).reduction).toBe(0.025);
    expect(protectiveFactors(fs({ selfcareGap: 0, lowAdherence: 0, socialWithdrawal: 0, taskSkipRate: 0 })).reduction).toBe(0.08);
  });
  it("en parciales el estrés resta 0.06 × su valor", () => {
    expect(academicAdjustment(fs({ stressHigh: 0.5 }), true)).toBe(0.03);
    expect(academicAdjustment(fs({ stressHigh: 0.5 }), false)).toBe(0);
  });
  it("la línea base personal exige 5 registros de días 8–28", () => {
    expect(computePersonalBaseline([ck("2026-10-10", 4, 2)], "2026-10-21")).toBeNull();
  });
  it("una semana peor que la propia normalidad sube el score", () => {
    const hist = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"].map((d) => ck(d, 4, 2));
    expect(personalAdjustment([...hist, ck("2026-10-20", 2, 4)], "2026-10-21")).toBeGreaterThan(0);
  });
});

describe("Confianza y contexto", () => {
  it("alta con 8+ check-ins y 75%+ cobertura; preliminar con pocos datos", () => {
    expect(signalConfidence(8, 0.8)).toBe("alta");
    expect(signalConfidence(5, 0.6)).toBe("media");
    expect(signalConfidence(3, 0.9)).toBe("baja");
  });
  it("reconoce fechas dentro de un periodo académico", () => {
    expect(isExamPeriod("2026-10-21", [{ start: "2026-10-19", end: "2026-10-24" }])).toBe(true);
    expect(isExamPeriod("2026-10-25", [{ start: "2026-10-19", end: "2026-10-24" }])).toBe(false);
  });
  it("sugiere misiones según el factor de riesgo principal", () => {
    const s = suggestMissions([{ key: "sleepDeficit", label: "", contribution: 0.3, value: 0.8, direction: "riesgo", description: "" }]);
    expect(s[0].missionId).toBe("breath-night");
  });
});
