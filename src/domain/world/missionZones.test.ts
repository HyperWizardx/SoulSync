// Verifica que cada misión AR se ambiente en una zona y que el resto se agrupe por categoría.
import { describe, expect, it } from "vitest";
import { MISSIONS, baseCategory } from "@/domain/gamification/missionsData";
import { arZoneFor, missionBelongsToZone, nextStepMission } from "./missionZones";
import { zoneInfo } from "./world";

const ZONES = [
  { key: "valle" as const, categories: ["autocuidado"] },
  { key: "bosque" as const, categories: ["reflexion", "cognitivo"] },
  { key: "reino" as const, categories: ["social", "reflexion"] },
  { key: "montana" as const, categories: ["movimiento", "ar"] },
];

describe("Misiones por zona", () => {
  it("asigna una zona a todas las misiones AR", () => {
    const ar = MISSIONS.filter((m) => m.isAR);
    expect(ar.length).toBeGreaterThan(0);
    expect(ar.filter((m) => arZoneFor(m) === null).map((m) => m.id)).toEqual([]);
  });
  it("reparte las misiones AR entre las 4 zonas", () => {
    for (const zone of ZONES) expect(MISSIONS.some((m) => m.isAR && missionBelongsToZone(m, zone))).toBe(true);
  });
  it("cada misión AR aparece en una sola zona", () => {
    for (const m of MISSIONS.filter((x) => x.isAR)) expect(ZONES.filter((z) => missionBelongsToZone(m, z))).toHaveLength(1);
  });
  it("las caminatas AR siguen en la Montaña y las misiones normales se agrupan por categoría", () => {
    expect(arZoneFor({ type: "ar-walk", isAR: true })).toBe("montana");
    expect(arZoneFor({ type: "journal", isAR: false })).toBeNull();
    expect(missionBelongsToZone({ type: "journal", isAR: false }, ZONES[1])).toBe(true);
    expect(missionBelongsToZone({ type: "journal", isAR: false }, ZONES[2])).toBe(true);
  });
  it("rotula la zona con su nombre", () => {
    expect(zoneInfo("reino").name).toBe("Reino de las Emociones");
  });
});

describe("Tu siguiente paso", () => {
  const zones = ZONES.map((z, i) => ({ ...z, unlocked: i < 3, progress: [80, 20, 50, 0][i] }));
  it("propone una misión de la zona desbloqueada con menos progreso", () => {
    const next = nextStepMission(zones, MISSIONS, new Set(), 99);
    expect(next?.zone).toBe("bosque");
    expect(missionBelongsToZone(next!.mission, ZONES[1])).toBe(true);
  });
  it("dentro de la zona prefiere una misión afín al arquetipo", () => {
    const next = nextStepMission(zones, MISSIONS, new Set(), 99, (m) => baseCategory(m) === "cognitivo");
    expect(next?.zone).toBe("bosque");
    expect(baseCategory(next!.mission)).toBe("cognitivo");
  });
  it("salta las misiones ya hechas hoy y las que piden más nivel", () => {
    const bosque = MISSIONS.filter((m) => missionBelongsToZone(m, ZONES[1]));
    const next = nextStepMission(zones, MISSIONS, new Set(bosque.map((m) => m.id)), 99);
    expect(next?.zone).toBe("reino");
    const lowLevel = nextStepMission(zones, MISSIONS, new Set(), 1);
    expect(lowLevel === null || !lowLevel.mission.requiredLevel || lowLevel.mission.requiredLevel <= 1).toBe(true);
  });
  it("no propone nada si no hay zonas desbloqueadas", () => {
    expect(nextStepMission(zones.map((z) => ({ ...z, unlocked: false })), MISSIONS, new Set(), 99)).toBeNull();
  });
});
