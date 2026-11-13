/** Pruebas de casos de uso con repositorios simulados (sin base de datos). */
import { describe, expect, it } from "vitest";
import { ConsentRequiredError, ScaleNotDueError, recordTaskEvent, recordWho5, registerCheckin, updateConsent, updateWritingShare, type WellbeingDeps } from "./useCases";

function fakeDeps(consented: boolean, lastScale: string | null = null) {
  const log: string[] = [];
  const deps: WellbeingDeps<string> = {
    consent: {
      hasActiveConsent: async () => consented,
      accept: async () => void log.push("accept"),
      revokeAndPurge: async () => void log.push("purge"),
      setShareWriting: async (_u: string, share: boolean) => void log.push(`share:${share}`),
    },
    events: {
      upsertCheckin: async (_u, d) => void log.push(`checkin:${d}`),
      insertTaskEvent: async (_u, _d, i) => void log.push(`task:${i.status}`),
      addTimeline: async (_u, e) => void log.push(`timeline:${e.kind}`),
      lastScaleAt: async () => lastScale,
      insertScale: async (_u, code, raw) => void log.push(`scale:${code}:${raw}`),
    },
    reader: { load: async () => "state" },
    today: () => "2026-10-19",
  };
  return { deps, log };
}
const task = { missionId: "m1", title: "T", category: "social" as const, durationSeconds: 0, isAR: false };

describe("pergamino del bienestar (WHO-5)", () => {
  it("guarda la escala y su hito cuando toca", async () => {
    const { deps, log } = fakeDeps(true, "2026-10-01");
    await recordWho5(deps, "u", [3, 3, 3, 3, 3]);
    expect(log).toEqual(["scale:WHO5:15", "timeline:milestone"]);
  });
  it("no se repite antes de 14 días ni sin consentimiento", async () => {
    await expect(recordWho5(fakeDeps(true, "2026-10-12").deps, "u", [3, 3, 3, 3, 3])).rejects.toBeInstanceOf(ScaleNotDueError);
    await expect(recordWho5(fakeDeps(false).deps, "u", [3, 3, 3, 3, 3])).rejects.toBeInstanceOf(ConsentRequiredError);
  });
});

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
  it("compartir los escritos con psicología exige consentimiento vigente", async () => {
    const ok = fakeDeps(true);
    await updateWritingShare(ok.deps, "u", true);
    expect(ok.log).toEqual(["share:true"]);
    const no = fakeDeps(false);
    await expect(updateWritingShare(no.deps, "u", true)).rejects.toBeInstanceOf(ConsentRequiredError);
  });
});
