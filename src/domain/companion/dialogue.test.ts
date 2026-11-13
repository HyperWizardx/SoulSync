// Verifica la conversación guiada: saludo, respuestas por ánimo, apoyo siempre a mano y misiones reales.
import { describe, expect, it } from "vitest";
import { companionTurn, FEELINGS, suggestedMission, type CompanionContext, type CompanionNode } from "./dialogue";
import { getMissionById } from "@/domain/gamification/missionsData";

const ctx: CompanionContext = {
  name: "Ana", archetypeName: "Mago", hour: 9, riskLevel: "bajo", topFactor: "stressHigh",
  forecastSky: "nubes", checkinToday: false, recommendation: { missionId: "walk-30", reason: "Probando algo nuevo." }, supportSuggested: false,
};

describe("Conversación con tu héroe", () => {
  it("saluda según la hora y ofrece los cinco estados de ánimo", () => {
    const t = companionTurn({ node: "inicio" }, ctx);
    expect(t.lines[0]).toContain("Buenos días, Ana");
    expect(t.choices.map((c) => c.id)).toEqual(FEELINGS.map((f) => f.key));
    expect(companionTurn({ node: "inicio" }, { ...ctx, hour: 22 }).lines[0]).toContain("Buenas noches");
  });
  it("con ánimo bueno propone la misión del recomendador; con estrés, una calmante", () => {
    expect(suggestedMission("bien", ctx).missionId).toBe("walk-30");
    expect(suggestedMission("estresado", ctx).missionId).toBe("breath-box");
  });
  it("con ánimo bajo o estrés siempre ofrece hablar con alguien", () => {
    for (const feeling of ["mal", "estresado"] as const) {
      const t = companionTurn({ node: "sentir", feeling }, ctx);
      expect(t.choices.some((c) => c.action?.kind === "support")).toBe(true);
    }
    const ok = companionTurn({ node: "sentir", feeling: "bien" }, ctx);
    expect(ok.choices.some((c) => c.action?.kind === "support")).toBe(false);
    const alert = companionTurn({ node: "sentir", feeling: "bien" }, { ...ctx, supportSuggested: true });
    expect(alert.choices.some((c) => c.action?.kind === "support")).toBe(true);
  });
  it("explica el factor principal y la semana solo si hay datos", () => {
    expect(companionTurn({ node: "porque", feeling: "regular" }, ctx).lines[0]).toContain("estrés");
    const noData = { ...ctx, topFactor: null, forecastSky: null, checkinToday: true };
    const t = companionTurn({ node: "sentir", feeling: "regular" }, noData);
    expect(t.choices.map((c) => c.id)).toEqual(["mision", "fin"]);
    expect(companionTurn({ node: "porque", feeling: "regular" }, noData).choices[0].id).toBe("mision");
  });
  it("sin check-in de hoy invita a registrarlo", () => {
    expect(companionTurn({ node: "sentir", feeling: "regular" }, ctx).choices.some((c) => c.action?.kind === "checkin")).toBe(true);
  });
  it("toda misión propuesta existe en el catálogo", () => {
    const nodes: CompanionNode[] = ["inicio", "sentir", "porque", "semana", "fin"];
    for (const node of nodes) for (const f of FEELINGS) for (const c of companionTurn({ node, feeling: f.key }, ctx).choices) {
      if (c.action?.kind === "mission") expect(getMissionById(c.action.missionId), c.action.missionId).toBeDefined();
    }
  });
});
