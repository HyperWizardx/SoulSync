// Pruebas de la cola de alertas del panel de psicología.
import { describe, expect, it } from "vitest";
import { alertFor, buildAlerts } from "./alerts";
import type { StudentRow } from "./aggregate";

const NOW = new Date("2026-11-10T15:00:00Z");
const row = (over: Partial<StudentRow>): StudentRow => ({
  userId: over.userId ?? "u", participantCode: "P-1", name: over.name ?? "Ana", email: null, level: 1, streak: 0, archetype: 0,
  consent: "vigente", riskLevel: "bajo", score: 0.2, trend: "estable", coverage: 1, checkins14: 5, missions7: 3, skipped7: 0,
  adherence7: 0.5, lastCheckin: "2026-11-10", lastActivity: null, safetyFlags: 0, lastFollowUp: null, who5Raw: null, ...over,
});

describe("alertFor", () => {
  it("una regla de seguridad o un WHO-5 muy bajo es urgente", () => {
    expect(alertFor(row({ safetyFlags: 1 }), NOW)?.priority).toBe("urgente");
    expect(alertFor(row({ who5Raw: 6 }), NOW)).toEqual({ priority: "urgente", reasons: ["WHO-5 muy bajo (6/25)"] });
  });
  it("señal alta o WHO-5 bajo pide atención; moderada en aumento o desconexión, vigilar", () => {
    expect(alertFor(row({ riskLevel: "alto" }), NOW)?.priority).toBe("atencion");
    expect(alertFor(row({ who5Raw: 10 }), NOW)?.priority).toBe("atencion");
    expect(alertFor(row({ riskLevel: "moderado", trend: "empeorando" }), NOW)?.priority).toBe("vigilar");
    expect(alertFor(row({ lastCheckin: "2026-11-03" }), NOW)).toEqual({ priority: "vigilar", reasons: ["Sin check-in hace 7 días"] });
  });
  it("sin check-ins en la ventana, la desconexión se mide con la última misión", () => {
    expect(alertFor(row({ lastCheckin: null, lastActivity: "2026-10-01T18:00:00Z" }), NOW)).toEqual({ priority: "vigilar", reasons: ["Sin actividad hace 40 días"] });
    expect(alertFor(row({ lastCheckin: null, lastActivity: "2026-11-09T18:00:00Z" }), NOW)).toBeNull();
    expect(alertFor(row({ lastCheckin: null, lastActivity: null }), NOW)).toBeNull();
  });
  it("sin consentimiento vigente o sin señales no hay alerta", () => {
    expect(alertFor(row({ consent: "revocado", safetyFlags: 2 }), NOW)).toBeNull();
    expect(alertFor(row({ riskLevel: "moderado", trend: "estable", who5Raw: 18 }), NOW)).toBeNull();
  });
  it("la alerta urgente conserva los demás motivos", () => {
    expect(alertFor(row({ safetyFlags: 1, riskLevel: "alto" }), NOW)?.reasons).toEqual(["Regla de seguridad activa", "Señal alta del modelo"]);
  });
});

describe("buildAlerts", () => {
  it("ordena por prioridad, pendientes primero y seguimiento más antiguo primero", () => {
    const alerts = buildAlerts([
      row({ userId: "a", name: "Vigilar", lastCheckin: "2026-11-01" }),
      row({ userId: "b", name: "Atendida", riskLevel: "alto", lastFollowUp: "2026-11-08T10:00:00Z" }),
      row({ userId: "c", name: "Sin seguimiento", riskLevel: "alto" }),
      row({ userId: "d", name: "Vieja", riskLevel: "alto", lastFollowUp: "2026-10-20T10:00:00Z" }),
      row({ userId: "e", name: "Urgente", safetyFlags: 1, lastFollowUp: "2026-11-09T10:00:00Z" }),
      row({ userId: "f", name: "Tranquila" }),
    ], NOW);
    expect(alerts.map((a) => a.userId)).toEqual(["e", "c", "d", "b", "a"]);
    expect(alerts.find((a) => a.userId === "b")?.followUpPending).toBe(false);
    expect(alerts.find((a) => a.userId === "d")).toMatchObject({ followUpPending: true, daysSinceFollowUp: 21 });
    expect(alerts.find((a) => a.userId === "e")?.followUpPending).toBe(false);
  });
});
