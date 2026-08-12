import { describe, expect, it } from "vitest";
import { extractFeatures } from "./features";
import { baselineLogisticModel } from "./baselineLogistic";
import { computeTrend } from "./trend";
import { deriveWorldState } from "./world";
import type { CheckinRecord, PredictionInput, TaskEventRecord } from "./types";

const TODAY = "2026-03-15";

const dateAgo = (days: number) =>
  new Date(Date.parse(`${TODAY}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);

const checkins = (count: number, values: Partial<CheckinRecord>, offset = 0): CheckinRecord[] =>
  Array.from({ length: count }, (_, i) => ({
    date: dateAgo(i + offset),
    mood: 3,
    stress: 3,
    energy: 3,
    social: 3,
    sleepHours: 7,
    ...values,
  }));

const tasks = (
  count: number,
  status: TaskEventRecord["status"],
  category: TaskEventRecord["category"] = "autocuidado",
  offset = 0,
): TaskEventRecord[] =>
  Array.from({ length: count }, (_, i) => ({
    date: dateAgo(i + offset),
    missionId: `m-${status}-${i}`,
    status,
    category,
    durationSeconds: 60,
  }));

const missionsByDate = (days: number, perDay: number, offset = 0) => {
  const out: Record<string, number> = {};
  for (let i = 0; i < days; i++) out[dateAgo(i + offset)] = perDay;
  return out;
};

function makeInput(over: Partial<PredictionInput> = {}): PredictionInput {
  return {
    today: TODAY,
    checkins: checkins(7, {}),
    telemetry: { missionsByDate: {}, dailyGoal: 3, lastMissionDate: TODAY },
    ...over,
  };
}

describe("features de tareas diarias", () => {
  it("marca taskSkipRate como no disponible sin eventos", () => {
    const fs = extractFeatures(makeInput());
    expect(fs.features.taskSkipRate.available).toBe(false);
    expect(fs.features.selfcareGap.available).toBe(false);
  });

  it("calcula la proporción de tareas omitidas", () => {
    const fs = extractFeatures(
      makeInput({ taskEvents: [...tasks(3, "completed"), ...tasks(1, "skipped")] }),
    );
    expect(fs.features.taskSkipRate.value).toBeCloseTo(0.25, 4);
  });

  it("omitir todas las tareas maximiza la señal de omisión", () => {
    const fs = extractFeatures(makeInput({ taskEvents: tasks(4, "skipped") }));
    expect(fs.features.taskSkipRate.value).toBe(1);
  });

  it("detecta el hueco de autocuidado por días sin práctica", () => {
    const full = extractFeatures(makeInput({ taskEvents: tasks(7, "completed", "autocuidado") }));
    expect(full.features.selfcareGap.value).toBe(0);

    const partial = extractFeatures(makeInput({ taskEvents: tasks(2, "completed", "autocuidado") }));
    expect(partial.features.selfcareGap.value).toBeCloseTo(5 / 7, 4);

    const wrongCategory = extractFeatures(makeInput({ taskEvents: tasks(7, "completed", "cognitivo") }));
    expect(wrongCategory.features.selfcareGap.value).toBe(1);
  });

  it("las omisiones aumentan el score de riesgo frente a completar", () => {
    const good = baselineLogisticModel.predict(
      extractFeatures(makeInput({ taskEvents: tasks(6, "completed") })),
    );
    const bad = baselineLogisticModel.predict(
      extractFeatures(makeInput({ taskEvents: tasks(6, "skipped") })),
    );
    expect(bad.score!).toBeGreaterThan(good.score!);
  });
});

describe("tendencia esperada", () => {
  it("es indeterminada sin una de las dos ventanas", () => {
    const fs = extractFeatures(makeInput({ checkins: checkins(4, {}) }));
    expect(computeTrend(fs).trend).toBe("indeterminada");
    expect(fs.wellbeingIndexPrev7).toBeNull();
  });

  it("detecta mejora cuando el ánimo sube respecto a la semana previa", () => {
    const fs = extractFeatures(
      makeInput({
        checkins: [...checkins(5, { mood: 5, energy: 5, stress: 1, social: 5 }), ...checkins(5, { mood: 2, energy: 2, stress: 4, social: 2 }, 7)],
      }),
    );
    const { trend, trendDelta } = computeTrend(fs);
    expect(trend).toBe("mejorando");
    expect(trendDelta).toBeGreaterThan(0);
  });

  it("detecta empeoramiento en el sentido inverso", () => {
    const fs = extractFeatures(
      makeInput({
        checkins: [...checkins(5, { mood: 2, energy: 2, stress: 5, social: 2 }), ...checkins(5, { mood: 5, energy: 5, stress: 1, social: 5 }, 7)],
      }),
    );
    expect(computeTrend(fs).trend).toBe("empeorando");
  });

  it("es estable cuando el cambio está dentro del umbral", () => {
    const fs = extractFeatures(makeInput({ checkins: [...checkins(5, {}), ...checkins(5, {}, 7)] }));
    expect(computeTrend(fs).trend).toBe("estable");
  });

  it("la predicción expone trazabilidad completa", () => {
    const p = baselineLogisticModel.predict(
      extractFeatures(makeInput({ taskEvents: tasks(5, "completed") })),
    );
    expect(p.modelVersion).toBe("baseline-logistic-v2");
    expect(p.featureVersion).toBe("fv2");
    expect(p.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(["mejorando", "estable", "empeorando", "indeterminada"]).toContain(p.trend);
  });
});

describe("estado del Mundo derivado de la actividad real", () => {
  const base = {
    dailyGoal: 3,
    streak: 3,
    level: 5,
    checkinToday: true,
    wellbeingIndex7: 0.6,
    trend: "estable" as const,
    riskLevel: "bajo" as const,
  };

  it("crece con las tareas completadas hoy", () => {
    const low = deriveWorldState({ ...base, tasksToday: 0, tasksLast7: 0 });
    const high = deriveWorldState({ ...base, tasksToday: 3, tasksLast7: 15 });
    expect(high.vitality).toBeGreaterThan(low.vitality);
    expect(high.harmony).toBeGreaterThan(low.harmony);
  });

  it("desbloquea zonas según el nivel real", () => {
    const l1 = deriveWorldState({ ...base, level: 1, tasksToday: 1, tasksLast7: 5 });
    const l10 = deriveWorldState({ ...base, level: 10, tasksToday: 1, tasksLast7: 5 });
    expect(l1.zonesUnlocked).toBe(1);
    expect(l10.zonesUnlocked).toBe(4);
    expect(l1.zones.find((z) => z.key === "mar")?.unlocked).toBe(false);
  });

  it("cambia de estación según señal y tendencia", () => {
    expect(deriveWorldState({ ...base, tasksToday: 1, tasksLast7: 5, riskLevel: "alto" }).season).toBe("tormenta");
    expect(deriveWorldState({ ...base, tasksToday: 1, tasksLast7: 5, trend: "mejorando" }).season).toBe("crecimiento");
    expect(
      deriveWorldState({ ...base, tasksToday: 1, tasksLast7: 5, riskLevel: "insuficiente" }).season,
    ).toBe("niebla");
  });

  it("mantiene los valores dentro de 0–100", () => {
    const w = deriveWorldState({ ...base, tasksToday: 50, tasksLast7: 500, streak: 999, wellbeingIndex7: 1 });
    expect(w.vitality).toBeLessThanOrEqual(100);
    expect(w.harmony).toBeLessThanOrEqual(100);
    expect(w.zones.every((z) => z.progress >= 0 && z.progress <= 100)).toBe(true);
  });

  it("sincroniza Mundo y predicción desde la misma fuente de tareas", () => {
    const input = makeInput({
      checkins: checkins(6, { mood: 4 }),
      telemetry: { missionsByDate: missionsByDate(7, 3), dailyGoal: 3, lastMissionDate: TODAY },
      taskEvents: tasks(6, "completed"),
    });
    const fs = extractFeatures(input);
    const prediction = baselineLogisticModel.predict(fs);
    const world = deriveWorldState({
      tasksToday: 3,
      dailyGoal: 3,
      tasksLast7: 21,
      streak: 6,
      level: 5,
      checkinToday: true,
      wellbeingIndex7: fs.wellbeingIndex7,
      trend: prediction.trend,
      riskLevel: prediction.riskLevel,
    });
    expect(world.tasksToday).toBe(3);
    expect(world.vitality).toBeGreaterThan(60);
    expect(prediction.riskLevel).not.toBe("insuficiente");
  });
});
