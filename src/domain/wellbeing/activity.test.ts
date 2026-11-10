// Verifica la meta semanal de actividad física de la OMS (150 min, vigorosa cuenta doble, fuerza 2 días).
import { describe, expect, it } from "vitest";
import { summarizeWeek, weekStart, weeksWithGoal, type ActivityLog } from "./activity";

const log = (date: string, minutes: number, intensity: "moderada" | "vigorosa" = "moderada", strength = false): ActivityLog => ({ date, minutes, intensity, strength });

describe("Actividad física semanal (OMS)", () => {
  it("la semana empieza el lunes", () => {
    expect(weekStart("2026-11-10")).toBe("2026-11-09"); // martes → lunes
    expect(weekStart("2026-11-15")).toBe("2026-11-09"); // domingo → mismo lunes
    expect(weekStart("2026-11-16")).toBe("2026-11-16");
  });
  it("suma minutos equivalentes con la vigorosa al doble y cumple la meta en 150", () => {
    const w = summarizeWeek([log("2026-11-09", 60), log("2026-11-10", 45, "vigorosa")], "2026-11-10");
    expect(w.equivalentMinutes).toBe(150);
    expect(w.goalMet).toBe(true);
    expect(w.percent).toBe(100);
  });
  it("ignora la semana pasada y cuenta días de fuerza distintos", () => {
    const w = summarizeWeek([log("2026-11-08", 200), log("2026-11-09", 20, "moderada", true), log("2026-11-09", 10, "moderada", true), log("2026-11-11", 20, "moderada", true)], "2026-11-11");
    expect(w.equivalentMinutes).toBe(50);
    expect(w.strengthDays).toBe(2);
    expect(w.strengthMet).toBe(true);
    expect(w.activeDays).toBe(2);
  });
  it("cuenta las semanas que alcanzaron la meta", () => {
    expect(weeksWithGoal([log("2026-11-02", 150), log("2026-11-09", 100), log("2026-11-10", 25, "vigorosa")])).toBe(2);
  });
});
