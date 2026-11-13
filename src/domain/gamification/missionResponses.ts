/**
 * Respuestas de las misiones — capa de Dominio (pura).
 * Al completar una misión, el teléfono envía lo que el estudiante respondió (opción elegida en
 * cada pregunta, pasos marcados, lo que escribió). Aquí se arma lo que se guarda: las preguntas,
 * opciones y pasos salen del catálogo (no del teléfono), los textos se recortan, y los escritos
 * solo se guardan si el estudiante autorizó compartirlos con el equipo de psicología.
 */
import type { Mission } from "./missionsData";
import { quizFor } from "./quizzes";

export const MAX_TEXT = 2000;
export const MAX_ITEM = 300;

/** Lo que llega desde la misión (validado con zod en la capa de servicio). */
export type MissionResponseInput =
  | { kind: "quiz"; choices: number[] }
  | { kind: "texto"; text: string; mood?: string }
  | { kind: "gratitud"; items: string[] }
  | { kind: "pasos"; done: number[] }
  | { kind: "reto"; challenge: string };

export type ResponseKind = MissionResponseInput["kind"];

/** Lo que se guarda y ve el equipo de psicología. */
export type StoredResponse =
  | { kind: "quiz"; score: number; total: number; answers: { question: string; chosen: string | null; correct: boolean }[] }
  | { kind: "texto"; mood: string | null; text: string | null }
  | { kind: "gratitud"; items: string[] | null; count: number }
  | { kind: "pasos"; done: number; total: number; steps: { step: string; done: boolean }[] }
  | { kind: "reto"; challenge: string };

/** Escritos libres: solo se guardan si el estudiante lo autorizó. */
export const isWriting = (kind: ResponseKind) => kind === "texto" || kind === "gratitud";

const clean = (s: string, max: number) => s.replace(/\s+\n/g, "\n").trim().slice(0, max);

/**
 * Arma la respuesta a guardar. Devuelve null si no corresponde a la misión (p. ej. un quiz
 * para una misión que no es quiz) o si no hay nada que guardar.
 */
export function buildStoredResponse(mission: Mission, input: MissionResponseInput, shareWriting: boolean): StoredResponse | null {
  switch (input.kind) {
    case "quiz": {
      if (mission.type !== "quiz") return null;
      const bank = quizFor(mission.id);
      if (bank.length === 0) return null;
      const answers = bank.map((q, i) => {
        const choice = input.choices[i];
        const chosen = choice !== undefined && choice >= 0 && choice < q.options.length ? q.options[choice] : null;
        return { question: q.q, chosen, correct: choice === q.correct };
      });
      return { kind: "quiz", score: answers.filter((a) => a.correct).length, total: bank.length, answers };
    }
    case "pasos": {
      const steps = mission.steps ?? [];
      if (mission.type !== "steps" || steps.length === 0) return null;
      const done = new Set(input.done.filter((i) => i >= 0 && i < steps.length));
      return { kind: "pasos", done: done.size, total: steps.length, steps: steps.map((step, i) => ({ step, done: done.has(i) })) };
    }
    case "texto": {
      if (mission.type !== "journal" && mission.type !== "social") return null;
      const text = clean(input.text, MAX_TEXT);
      return { kind: "texto", mood: input.mood ? clean(input.mood, 40) : null, text: shareWriting && text ? text : null };
    }
    case "gratitud": {
      if (mission.type !== "gratitude") return null;
      const items = input.items.map((x) => clean(x, MAX_ITEM)).filter(Boolean).slice(0, 5);
      return { kind: "gratitud", items: shareWriting ? items : null, count: items.length };
    }
    case "reto": {
      if (mission.type !== "daily-challenge") return null;
      const challenge = clean(input.challenge, 120);
      return challenge ? { kind: "reto", challenge } : null;
    }
  }
}

/** Resumen corto para listas (panel del psicólogo). */
export function responseSummary(r: StoredResponse): string {
  switch (r.kind) {
    case "quiz": return `${r.score} de ${r.total} aciertos`;
    case "pasos": return `${r.done} de ${r.total} pasos`;
    case "texto": return r.text ? (r.mood ? `Ánimo: ${r.mood}` : "Escrito compartido") : "Escrito privado";
    case "gratitud": return r.items ? `${r.count} gratitudes` : `${r.count} gratitudes (privadas)`;
    case "reto": return r.challenge;
  }
}

export const RESPONSE_KIND_LABEL: Record<ResponseKind, string> = {
  quiz: "Quiz",
  texto: "Escrito",
  gratitud: "Gratitud",
  pasos: "Pasos",
  reto: "Reto del día",
};

/** Respuesta guardada, tal como la ve el equipo de psicología. */
export interface MissionResponseRecord {
  id: string;
  missionId: string;
  title: string;
  category: string;
  createdAt: string;
  sharedWriting: boolean;
  response: StoredResponse;
}

/** Filas de la base a registros, descartando las que no tienen una respuesta válida. */
export function toResponseRecords(rows: readonly { id: string; mission_id: string; mission_title: string; category: string; created_at: string; shared_writing?: boolean | null; payload: unknown }[]): MissionResponseRecord[] {
  return rows
    .filter((r) => r.payload !== null && typeof r.payload === "object" && "kind" in (r.payload as object))
    .map((r) => ({ id: r.id, missionId: r.mission_id, title: r.mission_title, category: r.category, createdAt: r.created_at, sharedWriting: Boolean(r.shared_writing), response: r.payload as StoredResponse }));
}
