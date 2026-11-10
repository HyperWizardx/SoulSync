// Verifica el recomendador propio: recompensas, prior por afinidad, muestreo reproducible y que aprende.
import { describe, expect, it } from "vitest";
import { armStats, missionOutcomes, recommend, recommendationReason, sampleBeta, seededRandom, summarizeRecommendations, type ArmStats } from "./recommender";

describe("Recomendador (muestreo de Thompson)", () => {
  it("mide el efecto con el check-in siguiente (hasta 2 días después)", () => {
    const out = missionOutcomes(
      [{ date: "2026-11-01", category: "reflexion" }, { date: "2026-11-01", category: "reflexion" }, { date: "2026-11-05", category: "social" }],
      [{ date: "2026-11-01", mood: 2, stress: 4 }, { date: "2026-11-02", mood: 3, stress: 3 }, { date: "2026-11-05", mood: 3, stress: 3 }, { date: "2026-11-09", mood: 5, stress: 1 }],
    );
    expect(out).toEqual([{ date: "2026-11-01", category: "reflexion", success: true }]); // social: sin check-in en 2 días
  });
  it("las categorías afines al arquetipo empiezan con ventaja", () => {
    const s = armStats([], ["reflexion"]);
    expect(s.find((x) => x.category === "reflexion")).toMatchObject({ alpha: 2, beta: 1 });
    expect(s.find((x) => x.category === "social")).toMatchObject({ alpha: 1, beta: 1 });
  });
  it("la muestra Beta tiene la media esperada", () => {
    const rand = seededRandom("media");
    const xs = Array.from({ length: 4000 }, () => sampleBeta(8, 2, rand));
    expect(xs.reduce((a, b) => a + b, 0) / xs.length).toBeCloseTo(0.8, 1);
  });
  it("es reproducible para el mismo estudiante y día", () => {
    const stats = armStats([]);
    const cands = [{ id: "a", category: "autocuidado" as const }, { id: "b", category: "social" as const }, { id: "c", category: "reflexion" as const }];
    expect(recommend({ stats, candidates: cands, rand: seededRandom("u1|2026-11-10") })).toEqual(recommend({ stats, candidates: cands, rand: seededRandom("u1|2026-11-10") }));
  });
  it("aprende: la categoría que funciona sale primero casi siempre", () => {
    const outcomes = [
      ...Array.from({ length: 8 }, (_, i) => ({ date: `2026-10-${10 + i}`, category: "movimiento" as const, success: true })),
      ...Array.from({ length: 8 }, (_, i) => ({ date: `2026-10-${10 + i}`, category: "cognitivo" as const, success: false })),
    ];
    const stats = armStats(outcomes);
    const cands = [{ id: "m", category: "movimiento" as const }, { id: "c", category: "cognitivo" as const }, { id: "s", category: "social" as const }];
    let first = 0;
    for (let i = 0; i < 200; i++) if (recommend({ stats, candidates: cands, rand: seededRandom(`d${i}`), n: 1 })[0].missionId === "m") first++;
    expect(first).toBeGreaterThan(150);
  });
  it("explica la recomendación con lo aprendido, la afinidad o la exploración", () => {
    const learned: ArmStats = { category: "reflexion", alpha: 4, beta: 2, successes: 3, trials: 4 };
    expect(recommendationReason(learned, false, "Mago")).toContain("3 de 4");
    expect(recommendationReason({ ...learned, trials: 0, successes: 0 }, true, "Mago")).toContain("Mago");
    expect(recommendationReason({ ...learned, trials: 0, successes: 0 }, false, "Mago")).toContain("nuevo");
  });
  it("resume la aceptación para el panel", () => {
    const r = summarizeRecommendations([{ category: "social", taken: true }, { category: "social", taken: false }, { category: "ar", taken: false }]);
    expect(r).toMatchObject({ shown: 3, taken: 1, acceptance: 33 });
    expect(r.byCategory[0]).toMatchObject({ category: "social", shown: 2, taken: 1, acceptance: 50 });
  });
});
