import { describe, expect, it } from "vitest";
import { PRESETS, buildFeatureSet, simulate } from "./simulate";
import { activeModel } from "@/domain/wellbeing/inference";

describe("simulador what-if", () => {
  it("da el mismo resultado que el modelo real para iguales indicadores", () => {
    const sc = PRESETS[0].scenario;
    const a = simulate(sc);
    const b = activeModel.predict(buildFeatureSet(sc));
    expect(a.score).toBe(b.score);
    expect(a.riskLevel).toBe(b.riskLevel);
  });
  it("el escenario estable da riesgo bajo y aislamiento uno mayor", () => {
    const stable = simulate(PRESETS[1].scenario);
    const iso = simulate(PRESETS[2].scenario);
    expect(stable.riskLevel).toBe("bajo");
    expect(iso.score!).toBeGreaterThan(stable.score!);
  });
  it("con menos de 3 check-ins devuelve insuficiente", () => {
    expect(simulate(PRESETS[0].scenario, 2).riskLevel).toBe("insuficiente");
  });
});
