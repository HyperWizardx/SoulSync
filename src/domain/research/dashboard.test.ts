/** Pruebas de las series del panel: solo cuenta a quien tiene consentimiento vigente. */
import { describe, expect, it } from "vitest";
import { buildDashboardSeries } from "./dashboard";
import type { StudentRow } from "./aggregate";

const row = (userId: string, consent: StudentRow["consent"], lastCheckin: string | null): StudentRow => ({
  userId, participantCode: "P", name: "x", email: null, level: 1, streak: 0, archetype: null, consent,
  riskLevel: "bajo", score: 0.2, trend: "estable", coverage: 1, checkins14: 1, missions7: 0, skipped7: 0, adherence7: null,
  lastCheckin, lastActivity: null, confidence: "media", safetyFlags: 0, topFactors: ["Estrés alto"],
});

describe("buildDashboardSeries", () => {
  const out = buildDashboardSeries({
    today: "2026-10-21",
    rows: [row("a", "vigente", "2026-10-21"), row("b", "ninguno", null), row("c", "vigente", "2026-10-10")],
    checkins: [
      { user_id: "a", checkin_date: "2026-10-21", mood: 4, stress: 2, sleep_hours: 7 },
      { user_id: "b", checkin_date: "2026-10-21", mood: 1, stress: 5, sleep_hours: 3 },
    ],
    missions: [{ user_id: "a", completed_date: "2026-10-21" }],
    tasks: [], predictions: [],
  });
  it("excluye check-ins sin consentimiento del promedio", () => {
    expect(out.daily.at(-1)).toMatchObject({ checkins: 1, mood: 4, stress: 2 });
  });
  it("cuenta participantes sin check-in en 3+ días", () => {
    expect(out.noCheckin3d).toBe(1);
  });
  it("relaciona misiones con el ánimo del mismo día", () => {
    expect(out.missionMood.withMissions).toBe(4);
  });
});
