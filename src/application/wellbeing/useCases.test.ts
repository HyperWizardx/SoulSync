/** Pruebas de casos de uso con repositorios simulados (sin base de datos). */
import { describe, expect, it } from "vitest";
import { ConsentRequiredError, recordTaskEvent, registerCheckin, updateConsent, type WellbeingDeps } from "./useCases";

function fakeDeps(consented: boolean) {
  const log: string[] = [];
  const deps: WellbeingDeps<string> = {
    consent: {
      hasActiveConsent: async () => consented,
      accept: async () => void log.push("accept"),
      revokeAndPurge: async () => void log.push("purge"),
    },
    events: {
      upsertCheckin: async (_u, d) => void log.push(`checkin:${d}`),
      insertTaskEvent: async (_u, _d, i) => void log.push(`task:${i.status}`),
      addTimeline: async (_u, e) => void log.push(`timeline:${e.kind}`),
    },
    reader: { load: async () => "state" },
    today: () => "2026-10-19",
  };
  return { deps, log };
}
const task = { missionId: "m1", title: "T", category: "social" as const, durationSeconds: 0, isAR: false };

describe("casos de uso de bienestar", () => {
  it("rechaza check-in sin consentimiento", async () => {
    const { deps, log } = fakeDeps(false);
    await expect(registerCheckin(deps, "u", { mood: 3, stress: 3, energy: 3, social: 3 })).rejects.toBeInstanceOf(ConsentRequiredError);
    expect(log).toEqual([]);
  });
  it("registra check-in del día y su timeline con consentimiento", async () => {
    const { deps, log } = fakeDeps(true);
    await registerCheckin(deps, "u", { mood: 3, stress: 3, energy: 3, social: 3 });
    expect(log).toEqual(["checkin:2026-10-19", "timeline:checkin"]);
  });
  it("sin consentimiento no graba telemetría de tareas", async () => {
    const { deps, log } = fakeDeps(false);
    expect(await recordTaskEvent(deps, "u", { ...task, status: "completed" })).toBe("state");
    expect(log).toEqual([]);
  });
  it("una tarea omitida se registra en la timeline", async () => {
    const { deps, log } = fakeDeps(true);
    await recordTaskEvent(deps, "u", { ...task, status: "skipped" });
    expect(log).toEqual(["task:skipped", "timeline:task_skipped"]);
  });
  it("revocar el consentimiento purga los datos", async () => {
    const { deps, log } = fakeDeps(true);
    await updateConsent(deps, "u", false);
    expect(log).toEqual(["purge"]);
  });
});
