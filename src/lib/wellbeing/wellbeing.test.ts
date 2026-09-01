import { describe, expect, it } from "vitest";
import { extractFeatures, daysBetween } from "./features";
import { baselineLogisticModel, MIN_CHECKINS, toRiskLevel } from "./baselineLogistic";
import type { CheckinRecord, PredictionInput } from "./types";

const TODAY = "2026-03-15";

function dateAgo(days: number) {
  const d = new Date(Date.parse(`${TODAY}T00:00:00Z`) - days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function checkins(
  count: number,
  values: Partial<CheckinRecord>,
  offset = 0,
): CheckinRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    date: dateAgo(i + offset),
    mood: 3,
    stress: 3,
    energy: 3,
    social: 3,
    sleepHours: null,
    ...values,
  }));
}

function makeInput(over: Partial<PredictionInput> = {}): PredictionInput {
  return {
    today: TODAY,
    checkins: [],
    telemetry: { missionsByDate: {}, dailyGoal: 3, lastMissionDate: TODAY },
    ...over,
  };
}

describe("daysBetween", () => {
  it("cuenta días entre fechas ISO", () => {
    expect(daysBetween("2026-03-10", "2026-03-15")).toBe(5);
    expect(daysBetween("2026-03-15", "2026-03-15")).toBe(0);
  });
  it("devuelve NaN con fechas inválidas", () => {
    expect(Number.isNaN(daysBetween("no-fecha", TODAY))).toBe(true);
  });
});

describe("extractFeatures", () => {
  it("marca features no disponibles cuando no hay check-ins", () => {
    const fs = extractFeatures(makeInput());
    expect(fs.checkinCount14).toBe(0);
    expect(fs.features.moodLow.available).toBe(false);
    expect(fs.features.sleepDeficit.available).toBe(false);
    expect(fs.features.scaleDistress.available).toBe(false);
    // La adherencia siempre es calculable a partir de telemetría.
    expect(fs.features.lowAdherence.available).toBe(true);
  });

  it("normaliza ánimo bajo a riesgo alto y ánimo alto a riesgo bajo", () => {
    const low = extractFeatures(makeInput({ checkins: checkins(5, { mood: 1 }) }));
    const high = extractFeatures(makeInput({ checkins: checkins(5, { mood: 5 }) }));
    expect(low.features.moodLow.value).toBe(1);
    expect(high.features.moodLow.value).toBe(0);
  });

  it("detecta descenso de ánimo respecto a la semana previa", () => {
    const input = makeInput({
      checkins: [...checkins(5, { mood: 2 }), ...checkins(5, { mood: 4 }, 7)],
    });
    const fs = extractFeatures(input);
    expect(fs.features.moodDecline.value).toBe(1);
  });

  it("solo calcula sueño cuando hay horas reportadas", () => {
    const fs = extractFeatures(makeInput({ checkins: checkins(4, { sleepHours: 5 }) }));
    expect(fs.features.sleepDeficit.available).toBe(true);
    expect(fs.features.sleepDeficit.value).toBeCloseTo(0.5, 5);
  });

  it("calcula caída de engagement y adherencia desde telemetría", () => {
    const missionsByDate: Record<string, number> = {};
    for (let i = 7; i < 14; i++) missionsByDate[dateAgo(i)] = 2;
    const fs = extractFeatures(
      makeInput({ checkins: checkins(4, {}), telemetry: { missionsByDate, dailyGoal: 3, lastMissionDate: dateAgo(7) } }),
    );
    expect(fs.features.engagementDrop.value).toBe(1);
    expect(fs.features.lowAdherence.value).toBe(1);
    expect(fs.features.streakBreak.value).toBe(1);
  });

  it("ignora check-ins con fecha futura o inválida", () => {
    const fs = extractFeatures(
      makeInput({
        checkins: [
          { date: "2026-03-20", mood: 1, stress: 5, energy: 1, social: 1 },
          { date: "fecha-mala", mood: 1, stress: 5, energy: 1, social: 1 },
        ],
      }),
    );
    expect(fs.checkinCount14).toBe(0);
  });

  it("acota valores fuera de rango", () => {
    const fs = extractFeatures(makeInput({ checkins: checkins(3, { mood: 99, stress: -4 }) }));
    expect(fs.features.moodLow.value).toBe(0);
    expect(fs.features.stressHigh.value).toBe(0);
  });
});

describe("baselineLogisticModel", () => {
  it("devuelve 'insuficiente' con menos de los check-ins mínimos", () => {
    const p = baselineLogisticModel.predict(extractFeatures(makeInput({ checkins: checkins(MIN_CHECKINS - 1, {}) })));
    expect(p.riskLevel).toBe("insuficiente");
    expect(p.score).toBeNull();
    expect(p.insufficientReason).toBeTruthy();
  });

  it("clasifica riesgo bajo con indicadores favorables", () => {
    const missionsByDate: Record<string, number> = {};
    for (let i = 0; i < 7; i++) missionsByDate[dateAgo(i)] = 3;
    const p = baselineLogisticModel.predict(
      extractFeatures(
        makeInput({
          checkins: checkins(7, { mood: 5, stress: 1, energy: 5, social: 5, sleepHours: 8 }),
          telemetry: { missionsByDate, dailyGoal: 3, lastMissionDate: TODAY },
        }),
      ),
    );
    expect(p.riskLevel).toBe("bajo");
    expect(p.score).toBeLessThan(0.35);
  });

  it("clasifica riesgo alto con indicadores desfavorables", () => {
    const p = baselineLogisticModel.predict(
      extractFeatures(
        makeInput({
          checkins: checkins(7, { mood: 1, stress: 5, energy: 1, social: 1, sleepHours: 3 }),
          telemetry: { missionsByDate: {}, dailyGoal: 3, lastMissionDate: dateAgo(10) },
        }),
      ),
    );
    expect(p.riskLevel).toBe("alto");
    expect(p.score).toBeGreaterThan(0.65);
  });

  it("incluye trazabilidad completa", () => {
    const p = baselineLogisticModel.predict(extractFeatures(makeInput({ checkins: checkins(5, {}) })));
    expect(p.modelVersion).toBe("baseline-logistic-v2");
    expect(p.featureVersion).toBe("fv3");
    expect(typeof p.generatedAt).toBe("string");
    expect(p.coverage).toBeGreaterThan(0);
  });

  it("ordena la explicación por contribución descendente y suma ~1", () => {
    const p = baselineLogisticModel.predict(
      extractFeatures(makeInput({ checkins: checkins(6, { mood: 2, stress: 4, social: 2, sleepHours: 5 }) })),
    );
    const contribs = p.explanation.map((e) => e.contribution);
    expect([...contribs].sort((a, b) => b - a)).toEqual(contribs);
    const totalWeightNormalized = p.explanation.reduce((s, e) => s + e.contribution, 0);
    expect(totalWeightNormalized).toBeGreaterThan(0);
    expect(totalWeightNormalized).toBeLessThanOrEqual(1.0001);
  });

  it("usa escalas validadas solo si son recientes", () => {
    const stale = extractFeatures(
      makeInput({
        checkins: checkins(5, {}),
        scales: [{ code: "phq-like", raw: 20, max: 27, answeredAt: dateAgo(90) }],
      }),
    );
    expect(stale.features.scaleDistress.available).toBe(false);

    const fresh = extractFeatures(
      makeInput({
        checkins: checkins(5, {}),
        scales: [{ code: "phq-like", raw: 20, max: 27, answeredAt: dateAgo(3) }],
      }),
    );
    expect(fresh.features.scaleDistress.available).toBe(true);
  });
});

describe("toRiskLevel", () => {
  it("aplica los umbrales en los bordes", () => {
    expect(toRiskLevel(0.3499)).toBe("bajo");
    expect(toRiskLevel(0.35)).toBe("moderado");
    expect(toRiskLevel(0.6499)).toBe("moderado");
    expect(toRiskLevel(0.65)).toBe("alto");
  });
});
