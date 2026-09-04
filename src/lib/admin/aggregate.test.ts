import { describe, expect, it } from "vitest";
import { aggregatePopulation, participantCode, toCsv, type StudentRow } from "./aggregate";

const base: StudentRow = {
  userId: "11111111-2222-3333-4444-555555555555",
  participantCode: "P-111112",
  name: "Test",
  email: null,
  level: 1,
  streak: 0,
  archetype: null,
  consent: "vigente",
  riskLevel: "bajo",
  score: 0.2,
  trend: "estable",
  coverage: 0.8,
  checkins14: 4,
  missions7: 6,
  skipped7: 2,
  adherence7: 0.5,
  lastCheckin: "2026-09-04",
  lastActivity: "2026-09-04T10:00:00Z",
};

describe("participantCode", () => {
  it("es estable y seudónimo", () => {
    const code = participantCode(base.userId);
    expect(code).toBe(participantCode(base.userId));
    expect(code.startsWith("P-")).toBe(true);
    expect(base.userId.includes(code.slice(2).toLowerCase())).toBe(true);
    expect(code.length).toBe(8);
  });

  it("tolera ids vacíos", () => {
    expect(participantCode("")).toBe("P-000000");
  });
});

describe("aggregatePopulation", () => {
  it("cuenta consentimiento, riesgo y actividad", () => {
    const rows: StudentRow[] = [
      base,
      { ...base, userId: "b", consent: "ninguno", riskLevel: null, trend: null, adherence7: null, missions7: 0, skipped7: 0, lastActivity: null },
      { ...base, userId: "c", riskLevel: "alto", trend: "empeorando", adherence7: 0.1, missions7: 1, skipped7: 3 },
    ];
    const m = aggregatePopulation(rows, "2026-09-04");
    expect(m.total).toBe(3);
    expect(m.withConsent).toBe(2);
    expect(m.withSignal).toBe(2);
    expect(m.riskDistribution.alto).toBe(1);
    expect(m.trendDistribution.empeorando).toBe(1);
    expect(m.activeToday).toBe(2);
    expect(m.avgAdherence7).toBeCloseTo(0.3);
    expect(m.skipRate).toBeCloseTo(5 / 12);
  });

  it("devuelve nulos sin datos", () => {
    const m = aggregatePopulation([], "2026-09-04");
    expect(m.avgAdherence7).toBeNull();
    expect(m.skipRate).toBeNull();
    expect(m.total).toBe(0);
  });
});

describe("toCsv", () => {
  it("escapa comas y comillas", () => {
    const csv = toCsv(["a", "b"], [["x,y", 'di"jo'], [null, 3]]);
    expect(csv.split("\n")[1]).toBe('"x,y","di""jo"');
    expect(csv.split("\n")[2]).toBe(",3");
  });
});
