// Verifica la calidad del catálogo de misiones: sin repetidas, exclusivas por arquetipo,
// quizzes con preguntas propias y misiones por pasos completas.
import { describe, expect, it } from "vitest";
import { MISSIONS, estimateMinutes, visibleMissions } from "./missionsData";
import { QUIZZES } from "./quizzes";

describe("Catálogo de misiones", () => {
  it("no hay títulos repetidos", () => {
    const titles = MISSIONS.map((m) => m.title.toLowerCase());
    expect(titles.filter((t, i) => titles.indexOf(t) !== i)).toEqual([]);
  });
  it("no quedan textos de prueba ni de género fijo", () => {
    const texts = MISSIONS.flatMap((m) => [m.title, m.desc]).join(" | ");
    expect(texts).not.toMatch(/\(demo\)|\(AR\)|agradecido|ti mismo/i);
  });
  it("cada arquetipo tiene 3 misiones exclusivas que solo ve él", () => {
    for (const a of [0, 1, 2, 3]) {
      expect(MISSIONS.filter((m) => m.archetype === a)).toHaveLength(3);
      expect(visibleMissions(a).some((m) => m.archetype !== undefined && m.archetype !== a)).toBe(false);
    }
    expect(visibleMissions(null).some((m) => m.archetype !== undefined)).toBe(false);
  });
  it("cada quiz tiene su propio banco de preguntas, sin repetirse entre quizzes", () => {
    const quizzes = MISSIONS.filter((m) => m.type === "quiz");
    for (const q of quizzes) expect(QUIZZES[q.id]?.length ?? 0).toBeGreaterThanOrEqual(3);
    const all = Object.values(QUIZZES).flat().map((q) => q.q);
    expect(new Set(all).size).toBe(all.length);
    for (const bank of Object.values(QUIZZES)) for (const q of bank) expect(q.correct).toBeLessThan(q.options.length);
  });
  it("las misiones por pasos traen sus pasos y todas tienen una duración estimada", () => {
    for (const m of MISSIONS.filter((x) => x.type === "steps")) expect(m.steps?.length ?? 0).toBeGreaterThanOrEqual(3);
    for (const m of MISSIONS) expect(estimateMinutes(m)).toBeGreaterThanOrEqual(1);
  });
});
