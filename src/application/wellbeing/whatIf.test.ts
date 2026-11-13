// Verifica el "¿Y si…?" del estudiante: parte de su brújula, solo mejora hábitos disponibles y usa el modelo activo.
import { describe, expect, it } from "vitest";
import { applyLevers, availableLevers, runWhatIf, scenarioFromExplanation } from "./whatIf";
import { activeModel } from "@/domain/wellbeing/inference";

const explanation = [
  { key: "stressHigh" as const, value: 0.8 },
  { key: "sleepDeficit" as const, value: 0.7 },
  { key: "moodLow" as const, value: 0.6 },
  { key: "socialWithdrawal" as const, value: 0.1 },
  { key: "lowAdherence" as const, value: 0.5 },
];

describe("¿Y si…? del estudiante", () => {
  it("solo ofrece hábitos con indicadores disponibles y marca los que ya van bien", () => {
    const levers = availableLevers(scenarioFromExplanation(explanation));
    expect(levers.map((l) => l.lever.key)).toEqual(["sueno", "estres", "meta", "social"]);
    expect(levers.find((l) => l.lever.key === "social")?.good).toBe(true);
  });
  it("aplicar un hábito baja solo sus indicadores", () => {
    const base = scenarioFromExplanation(explanation);
    const s = applyLevers(base, new Set(["estres"]));
    expect(s.stressHigh).toBeCloseTo(0.32);
    expect(s.sleepDeficit).toBe(0.7);
    expect(s.lateCheckin).toBeNull();
  });
  it("sin hábitos no cambia nada; con hábitos la brújula mejora", () => {
    const base = scenarioFromExplanation(explanation);
    expect(runWhatIf(activeModel, base, new Set()).improvement).toBe(0);
    const r = runWhatIf(activeModel, base, new Set(["estres", "sueno", "meta"]));
    expect(r.after).not.toBeNull();
    expect(r.improvement).toBeGreaterThan(0);
  });
});
