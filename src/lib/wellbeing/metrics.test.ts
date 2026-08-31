import { describe, expect, it } from "vitest";
import { deriveUserMetrics } from "./metrics";
import type { CheckinRecord } from "./types";

const TODAY = new Date("2026-03-10T12:00:00Z");
const dayOffset = (n: number) => new Date(TODAY.getTime() - n * 86_400_000);

const mission = (id: string, offset: number) => ({
  id,
  title: id,
  date: dayOffset(offset).toDateString(),
  xp: 50,
});

const checkin = (offset: number, v: Partial<CheckinRecord> = {}): CheckinRecord => ({
  date: dayOffset(offset).toISOString().slice(0, 10),
  mood: 3,
  stress: 3,
  energy: 3,
  social: 3,
  ...v,
});

describe("deriveUserMetrics", () => {
  it("devuelve null y cobertura 0 sin actividad", () => {
    const m = deriveUserMetrics({ missionHistory: [], checkins: [], streak: 0, dailyGoal: 3, today: TODAY });
    for (const key of ["bienestar", "resiliencia", "energia", "claridad"] as const) {
      expect(m[key].value).toBeNull();
      expect(m[key].coverage).toBe(0);
      expect(m[key].source).toBe("Sin datos aún");
    }
  });

  it("calcula métricas solo con misiones completadas", () => {
    const m = deriveUserMetrics({
      missionHistory: [mission("journal-1", 0), mission("quiz-mind", 1), mission("walk-30", 2)],
      checkins: [],
      streak: 3,
      dailyGoal: 3,
      today: TODAY,
    });
    expect(m.claridad.value).not.toBeNull();
    expect(m.claridad.coverage).toBeGreaterThan(0);
    expect(m.claridad.coverage).toBeLessThan(1);
    expect(m.resiliencia.value).toBeGreaterThan(0);
    expect(m.energia.source).toContain("movimiento");
  });

  it("calcula métricas solo con check-ins", () => {
    const m = deriveUserMetrics({
      missionHistory: [],
      checkins: [checkin(0, { mood: 5, stress: 1, energy: 5, social: 5 })],
      streak: 0,
      dailyGoal: 3,
      today: TODAY,
    });
    expect(m.bienestar.value).toBe(100);
    expect(m.energia.value).toBe(100);
    expect(m.resiliencia.value).toBe(100);
    expect(m.bienestar.source).toContain("check-in");
  });

  it("un ánimo bajo y estrés alto reducen el bienestar", () => {
    const low = deriveUserMetrics({
      missionHistory: [],
      checkins: [checkin(0, { mood: 1, stress: 5 })],
      streak: 0,
      dailyGoal: 3,
      today: TODAY,
    });
    const high = deriveUserMetrics({
      missionHistory: [],
      checkins: [checkin(0, { mood: 5, stress: 1 })],
      streak: 0,
      dailyGoal: 3,
      today: TODAY,
    });
    expect(low.bienestar.value!).toBeLessThan(high.bienestar.value!);
  });

  it("combina misiones y check-ins con cobertura completa", () => {
    const m = deriveUserMetrics({
      missionHistory: [mission("breath-4", 0), mission("journal-1", 1)],
      checkins: [checkin(0), checkin(1)],
      streak: 2,
      dailyGoal: 3,
      today: TODAY,
    });
    expect(m.bienestar.coverage).toBe(1);
    expect(m.bienestar.source).toContain("misiones");
    expect(m.bienestar.source).toContain("check-in");
  });

  it("ignora actividad de hace más de 7 días", () => {
    const m = deriveUserMetrics({
      missionHistory: [mission("breath-4", 20)],
      checkins: [checkin(20)],
      streak: 0,
      dailyGoal: 3,
      today: TODAY,
    });
    expect(m.bienestar.value).toBeNull();
  });
});
