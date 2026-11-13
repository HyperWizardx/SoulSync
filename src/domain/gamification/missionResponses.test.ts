// Pruebas de las respuestas de misiones que ve el equipo de psicología.
import { describe, expect, it } from "vitest";
import { getMissionById } from "./missionsData";
import { buildStoredResponse, responseSummary } from "./missionResponses";
import { quizFor } from "./quizzes";

const m = (id: string) => getMissionById(id)!;

describe("respuestas de misiones", () => {
  it("el quiz guarda preguntas y opciones del catálogo y calcula los aciertos en el servidor", () => {
    const bank = quizFor("quiz-move");
    const r = buildStoredResponse(m("quiz-move"), { kind: "quiz", choices: [1, 0, 0, 99] }, false);
    expect(r).toMatchObject({ kind: "quiz", score: 2, total: bank.length });
    if (r?.kind !== "quiz") throw new Error();
    expect(r.answers[0]).toEqual({ question: bank[0].q, chosen: bank[0].options[1], correct: true });
    expect(r.answers[3].chosen).toBeNull();
    expect(responseSummary(r)).toBe(`2 de ${bank.length} aciertos`);
  });

  it("los escritos solo se guardan si el estudiante autorizó compartirlos", () => {
    const shared = buildStoredResponse(m("journal-1"), { kind: "texto", text: "  Hoy fue un buen día  ", mood: "Calma" }, true);
    expect(shared).toEqual({ kind: "texto", mood: "Calma", text: "Hoy fue un buen día" });
    const hidden = buildStoredResponse(m("journal-1"), { kind: "texto", text: "secreto", mood: "Calma" }, false);
    expect(hidden).toEqual({ kind: "texto", mood: "Calma", text: null });
    expect(responseSummary(hidden!)).toBe("Escrito privado");
    const grat = buildStoredResponse(m("gratitude-3"), { kind: "gratitud", items: ["mi mamá", " ", "el sol"] }, false);
    expect(grat).toEqual({ kind: "gratitud", items: null, count: 2 });
  });

  it("los pasos se toman del catálogo y se ignoran índices inválidos", () => {
    const steps = m("rogue-explore").steps!;
    const r = buildStoredResponse(m("rogue-explore"), { kind: "pasos", done: [0, 2, 2, 50] }, false);
    expect(r).toMatchObject({ kind: "pasos", done: 2, total: steps.length });
  });

  it("rechaza respuestas que no corresponden al tipo de misión y recorta textos largos", () => {
    expect(buildStoredResponse(m("hydrate"), { kind: "quiz", choices: [0] }, true)).toBeNull();
    expect(buildStoredResponse(m("quiz-move"), { kind: "texto", text: "x" }, true)).toBeNull();
    const long = buildStoredResponse(m("journal-1"), { kind: "texto", text: "a".repeat(5000) }, true);
    expect(long?.kind === "texto" && long.text?.length).toBe(2000);
  });
});
