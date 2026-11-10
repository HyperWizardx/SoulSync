// Pruebas de la brújula entrenada: ajuste MAP, métricas, validación agrupada, ejemplos sin fuga
// y modelo resultante (misma interfaz, mismo criterio de decisión).
import { describe, expect, it } from "vitest";
import { PASSIVE_FEATURES, baselineLogisticModel } from "./baselineLogistic";
import { DECISION_MODEL_VERSION } from "./decision";
import { extractFeatures } from "./features";
import { FEATURE_KEYS, expertPrior, explainTrained, isUsableParams, resolveActiveModel, trainedScore, type TrainedParams } from "./trainedLogistic";
import {
  TRAINING_MIN, auc, buildSamples, compassGate, evaluate, fitMapLogistic, groupFolds, solveLinear, trainCompass,
  type StudentHistory,
} from "./training";
import type { CheckinRecord, FeatureKey, FeatureSet, ScaleRecord } from "./types";

const day = (base: string, offset: number) => new Date(Date.parse(`${base}T12:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);

/** Historia sintética: 5 pergaminos cada 14 días; el bienestar bajo depende del sueño. */
function history(id: string, poorSleepPeriods: boolean[], archetype: number): StudentHistory {
  const start = "2026-06-01";
  const checkins: CheckinRecord[] = [];
  const scales: ScaleRecord[] = [];
  const missionDates: string[] = [];
  poorSleepPeriods.forEach((poor, p) => {
    for (let d = 0; d < 14; d++) {
      const date = day(start, p * 14 + d);
      checkins.push({ date, mood: 3, stress: 3, energy: 3, social: 3, sleepHours: poor ? 4.5 : 8 });
      if (d % 2 === 0) missionDates.push(date);
    }
    scales.push({ code: "WHO5", raw: poor ? 8 : 18, max: 25, answeredAt: day(start, p * 14 + 13) });
  });
  return { userId: id, checkins, missionDates, dailyGoal: 1, taskEvents: [], scales, group: { archetype: String(archetype) } };
}

describe("álgebra y ajuste MAP", () => {
  it("resuelve sistemas lineales", () => {
    const x = solveLinear([[2, 1], [1, 3]], [3, 5]);
    expect(x[0]).toBeCloseTo(0.8, 6);
    expect(x[1]).toBeCloseTo(1.4, 6);
  });
  it("con λ enorme se queda en el criterio experto; con λ pequeño aprende de los datos", () => {
    const X = [[0], [0], [0], [1], [1], [1]];
    const y = [0, 0, 0, 1, 1, 1];
    const prior = { bias: -1, coef: [0.5] };
    const rigid = fitMapLogistic(X, y, prior, 1e6);
    expect(rigid.coef[0]).toBeCloseTo(0.5, 3);
    expect(rigid.bias).toBeCloseTo(-1, 2);
    const learned = fitMapLogistic(X, y, prior, 0.1);
    expect(learned.coef[0]).toBeGreaterThan(2);
  });
});

describe("métricas", () => {
  it("AUC: separación perfecta = 1, empate total = 0.5, una clase = null", () => {
    expect(auc([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9])).toBe(1);
    expect(auc([0, 1, 0, 1], [0.5, 0.5, 0.5, 0.5])).toBe(0.5);
    expect(auc([1, 1], [0.2, 0.3])).toBeNull();
  });
  it("Brier, sensibilidad y especificidad con el umbral moderado", () => {
    const m = evaluate([1, 1, 0, 0], [0.9, 0.2, 0.1, 0.6]);
    expect(m.brier).toBeCloseTo((0.01 + 0.64 + 0.01 + 0.36) / 4, 4);
    expect(m.sensitivity).toBe(0.5);
    expect(m.specificity).toBe(0.5);
  });
});

describe("validación agrupada y ejemplos", () => {
  it("un mismo estudiante nunca queda en dos pliegues", () => {
    const users = ["a", "a", "b", "c", "c", "d", "e", "f"];
    const folds = groupFolds(users, 3, "x")!;
    expect(folds[0]).toBe(folds[1]);
    expect(folds[3]).toBe(folds[4]);
    expect(new Set(folds).size).toBe(3);
    expect(groupFolds(["a", "a"], 5, "x")).toBeNull();
  });
  it("cada pergamino da un ejemplo con datos anteriores y sin usar su propio puntaje", () => {
    const samples = buildSamples([history("u1", [true, false], 0)]);
    expect(samples).toHaveLength(2);
    expect(samples[0]).toMatchObject({ y: 1, who5: 8 });
    expect(samples[1]).toMatchObject({ y: 0, who5: 18 });
    // El primer pergamino no ve ningún WHO-5 previo; el segundo ve solo el anterior.
    expect(samples[0].features.features.scaleDistress.available).toBe(false);
    expect(samples[1].features.features.scaleDistress.available).toBe(true);
    expect(samples[0].features.features.sleepDeficit.value).toBeGreaterThan(0.5);
  });
});

describe("entrenamiento completo", () => {
  const pattern = (i: number) => [0, 1, 2, 3, 4].map((p) => (i + p) % 3 === 0);
  const histories = Array.from({ length: 12 }, (_, i) => history(`u${i}`, pattern(i), i % 4));
  const samples = buildSamples(histories);
  const t = trainCompass(samples, { now: new Date("2026-11-10T15:00:00Z") });

  it("valida con estudiantes distintos y aprende el peso del sueño", () => {
    expect(t.n).toBe(60);
    expect(t.cv).not.toBeNull();
    expect(t.params?.version).toBe("brujula-map-20261110-1500");
    expect(t.params!.coef.sleepDeficit).toBeGreaterThan(expertPrior().coef.sleepDeficit);
    expect(t.cv!.trained.logLoss).toBeLessThan(t.cv!.expert.logLoss);
    expect(t.oof!.trained).toHaveLength(60);
  });
  it("el compuerta exige datos, mejora y equidad", () => {
    expect(compassGate(t, true)).toEqual({ ready: true, reasons: [] });
    expect(compassGate(t, false).ready).toBe(false);
    const small = compassGate({ ...t, n: 10, students: 3, positives: 2, negatives: 8 }, true);
    expect(small.reasons.length).toBeGreaterThanOrEqual(3);
    expect(TRAINING_MIN.samples).toBe(40);
  });
  it("el modelo entrenado usa el mismo criterio de decisión y explica cada factor", () => {
    const model = resolveActiveModel(t.params);
    expect(model.modelVersion).toBe(t.params!.version);
    const p = model.predict(samples[0].features);
    expect(p.score).toBeGreaterThanOrEqual(0);
    expect(p.score).toBeLessThanOrEqual(1);
    expect(p.explanation.length).toBeGreaterThan(0);
    expect(p.confidence).toBeDefined();
  });
});

describe("brújula entrenada", () => {
  const today = "2026-11-10";
  const checkins: CheckinRecord[] = Array.from({ length: 7 }, (_, i) => ({ date: day(today, -i), mood: 2, stress: 4, energy: 2, social: 2, sleepHours: 5 }));
  const fs = extractFeatures({ today, checkins, telemetry: { missionsByDate: { [today]: 1 }, dailyGoal: 1, lastMissionDate: today } });

  it("parte exactamente del criterio experto (todos los indicadores no pasivos disponibles)", () => {
    const prior = expertPrior();
    const zeros = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as Record<FeatureKey, number>;
    const full: FeatureSet = {
      ...fs,
      features: Object.fromEntries(FEATURE_KEYS.map((k, i) => [k, PASSIVE_FEATURES.has(k)
        ? { key: k, value: null, available: false }
        : { key: k, value: (i % 5) / 4, available: true }])) as FeatureSet["features"],
    };
    expect(trainedScore({ ...prior, means: zeros }, full)).toBeCloseTo(baselineLogisticModel.predict(full).score!, 3);
  });
  it("sin parámetros válidos se usa el criterio experto", () => {
    expect(resolveActiveModel(null).modelVersion).toBe(DECISION_MODEL_VERSION);
    expect(resolveActiveModel({ featureVersion: "fv1" }).modelVersion).toBe(DECISION_MODEL_VERSION);
    expect(isUsableParams({})).toBe(false);
  });
  it("la explicación marca como protector lo que baja el riesgo", () => {
    const means = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0.5])) as Record<FeatureKey, number>;
    const coef = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 1])) as Record<FeatureKey, number>;
    const exp = explainTrained(fs, { coef, means } as Pick<TrainedParams, "coef" | "means">);
    expect(exp.find((e) => e.key === "moodLow")?.direction).toBe("riesgo");
    expect(exp.find((e) => e.key === "streakBreak")?.direction).toBe("protector");
    expect(exp.reduce((s, e) => s + e.contribution, 0)).toBeCloseTo(1, 2);
  });
  it("con pocos check-ins la brújula entrenada tampoco opina", () => {
    const thin = extractFeatures({ today, checkins: checkins.slice(0, 2), telemetry: { missionsByDate: {}, dailyGoal: 1 } });
    const params = { ...expertPrior(), means: Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])), version: "brujula-test", featureVersion: fs.featureVersion, lambda: 1, n: 0, positives: 0, trainedAt: "" } as TrainedParams;
    expect(resolveActiveModel(params).predict(thin).riskLevel).toBe("insuficiente");
  });
});
