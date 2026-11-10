// Pruebas de los perfiles del grupo (k-means propio) y de la auditoría de equidad.
import { describe, expect, it } from "vitest";
import { MIN_PROFILE_SIZE, buildProfiles, kmeans, silhouette, type ProfileVector } from "./clustering";
import { auditEquity, UNDISCLOSED } from "./equity";
import { EQUITY_ATTRIBUTES, equityGroup, isValidParticipantProfile } from "./participant";

// Variación determinista para que ningún estudiante sea idéntico a otro.
const n = (i: number, k: number) => 0.25 * Math.sin(i * 1.7 + k);
const rested = (i: number): ProfileVector => ({ mood: 4 + n(i, 1), stress: 2 + n(i, 2), energy: 4 + n(i, 3), social: 4 + n(i, 4), sleep: 8 + n(i, 5), regularity: 0.9 + n(i, 6) / 5, missions: 10 + n(i, 7) * 4, lateNights: 0.05 + n(i, 8) / 5 });
const tired = (i: number): ProfileVector => ({ mood: 2.5 + n(i, 9), stress: 4.5 + n(i, 10), energy: 2 + n(i, 11), social: 2.5 + n(i, 12), sleep: 5 + n(i, 13), regularity: 0.5 + n(i, 14) / 5, missions: 3 + n(i, 15) * 4, lateNights: 0.6 + n(i, 16) / 5 });

describe("perfiles del grupo", () => {
  it("k-means separa dos grupos claros y la silueta lo confirma", () => {
    const pts = [[0, 0], [0.1, 0], [0, 0.1], [5, 5], [5.1, 5], [5, 5.1]];
    const fit = kmeans(pts, 2, "t");
    expect(new Set(fit.assignment.slice(0, 3)).size).toBe(1);
    expect(fit.assignment[0]).not.toBe(fit.assignment[3]);
    expect(silhouette(pts, fit.assignment)).toBeGreaterThan(0.9);
  });
  it("describe cada perfil y sugiere un taller", () => {
    const report = buildProfiles([...Array.from({ length: 6 }, (_, i) => rested(i)), ...Array.from({ length: 5 }, (_, i) => tired(i))])!;
    expect(report.k).toBe(2);
    expect(report.profiles.every((p) => p.size >= MIN_PROFILE_SIZE)).toBe(true);
    const stressed = report.profiles.find((p) => p.traits.includes("estrés alto"))!;
    expect(stressed.size).toBe(5);
    expect(stressed.workshop).toBeTruthy();
    expect(stressed.means.sleep).toBeLessThan(5.5);
  });
  it("con pocos estudiantes no se agrupa (nadie queda identificable)", () => {
    expect(buildProfiles([rested(0), tired(0), rested(1)])).toBeNull();
  });
  it("tolera datos faltantes imputando la media del grupo", () => {
    const vectors = [...Array.from({ length: 5 }, (_, i) => ({ ...rested(i), sleep: null })), ...Array.from({ length: 5 }, (_, i) => tired(i))];
    expect(buildProfiles(vectors)).not.toBeNull();
  });
});

describe("auditoría de equidad", () => {
  const rows = (fnrA: number, fnrB: number) => {
    const out: { group: Record<string, string | undefined>; y: number; p: number }[] = [];
    for (const [g, fnr] of [["0", fnrA], ["1", fnrB]] as const) {
      for (let i = 0; i < 10; i++) out.push({ group: { archetype: g }, y: 1, p: i < fnr * 10 ? 0.1 : 0.8 });
      for (let i = 0; i < 10; i++) out.push({ group: { archetype: g }, y: 0, p: 0.2 });
    }
    return out;
  };
  it("aprueba cuando los subgrupos reciben un trato parecido", () => {
    const r = auditEquity(rows(0.1, 0.2), EQUITY_ATTRIBUTES, 0.35);
    const arch = r.attributes.find((a) => a.key === "archetype")!;
    expect(arch.evaluable).toBe(true);
    expect(arch.fnrGap).toBeCloseTo(0.1, 4);
    expect(r.passed).toBe(true);
  });
  it("reprueba si a un grupo se le escapan muchos más casos", () => {
    const r = auditEquity(rows(0, 0.5), EQUITY_ATTRIBUTES, 0.35);
    expect(r.attributes.find((a) => a.key === "archetype")!.passed).toBe(false);
    expect(r.passed).toBe(false);
  });
  it("sin subgrupos comparables no se puede certificar", () => {
    const r = auditEquity([{ group: { gender: UNDISCLOSED }, y: 1, p: 0.9 }], EQUITY_ATTRIBUTES, 0.35);
    expect(r.evaluable).toBe(false);
    expect(r.passed).toBe(false);
  });
  it("la ficha opcional solo acepta valores conocidos", () => {
    expect(isValidParticipantProfile({ ageBand: "20-24", gender: "mujer", semesterBand: "4-6" })).toBe(true);
    expect(isValidParticipantProfile({ ageBand: "99", gender: "mujer", semesterBand: "4-6" })).toBe(false);
    expect(equityGroup(2, null)).toEqual({ archetype: "2", gender: undefined, ageBand: undefined, semesterBand: undefined });
  });
});
