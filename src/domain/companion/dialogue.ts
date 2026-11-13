/**
 * Conversación guiada con tu héroe — capa de Dominio (pura).
 * El avatar pregunta cómo llegas hoy y responde con lo que ya saben los modelos propios:
 * la brújula (factor principal), el pronóstico de ánimo y el recomendador de misiones.
 * No usa IA generativa ni guarda lo que se elige: es un árbol de opciones con textos fijos,
 * por eso nunca inventa consejos y siempre deja a mano el botón de apoyo.
 */
import type { FeatureKey, RiskLevel } from "@/domain/wellbeing/types";
import { SKY_COPY, type ForecastSky } from "@/domain/wellbeing/forecast";
import { FEATURE_LABELS, RECOMMENDATIONS } from "@/domain/wellbeing/copy";
import { FACTOR_MISSION } from "@/domain/wellbeing/factorActions";
import { getMissionById } from "@/domain/gamification/missionsData";

export type Feeling = "bien" | "regular" | "cansado" | "estresado" | "mal";
export type CompanionNode = "inicio" | "sentir" | "porque" | "semana" | "fin";
/** Cómo reacciona el avatar 3D en cada turno. */
export type CompanionMood = "calma" | "celebra" | "apoyo";

export interface CompanionContext {
  name: string;
  archetypeName: string;
  /** Hora local (0–23) para el saludo. */
  hour: number;
  riskLevel?: RiskLevel | null;
  /** Indicador que más mueve la brújula hoy (si es de riesgo). */
  topFactor?: FeatureKey | null;
  forecastSky?: ForecastSky | null;
  checkinToday: boolean;
  /** Primera misión que eligió hoy el recomendador. */
  recommendation?: { missionId: string; reason: string } | null;
  /** La brújula o el pergamino sugieren pedir apoyo. */
  supportSuggested: boolean;
}

export interface CompanionState { node: CompanionNode; feeling?: Feeling }

export type CompanionAction =
  | { kind: "mission"; missionId: string }
  | { kind: "support" }
  | { kind: "checkin" }
  | { kind: "close" };

export interface CompanionChoice {
  id: string;
  label: string;
  /** Siguiente estado de la conversación, o una acción que sale de ella. */
  next?: CompanionState;
  action?: CompanionAction;
}

export interface CompanionTurn { lines: string[]; choices: CompanionChoice[]; mood: CompanionMood }

export const FEELINGS: { key: Feeling; label: string }[] = [
  { key: "bien", label: "Con energía" },
  { key: "regular", label: "Más o menos" },
  { key: "cansado", label: "Sin energía" },
  { key: "estresado", label: "Con estrés" },
  { key: "mal", label: "Con el ánimo bajo" },
];

/** Respuesta empática y misión por defecto para cada estado de ánimo. */
const FEELING_REPLY: Record<Feeling, { lines: string[]; mission: string; mood: CompanionMood }> = {
  bien: { lines: ["¡Qué bien escucharlo! Aprovechemos ese impulso."], mission: "quiz-mind", mood: "celebra" },
  regular: { lines: ["Hay días así, a medio camino. Algo pequeño puede inclinar la balanza."], mission: "journal-1", mood: "calma" },
  cansado: { lines: ["El cansancio también es una señal. Hoy toca cuidar tu energía, no exigirte más."], mission: "breath-night", mood: "calma" },
  estresado: { lines: ["Gracias por decírmelo. Bajemos un poco las revoluciones juntos."], mission: "breath-box", mood: "apoyo" },
  mal: { lines: ["Siento que hoy pese tanto. No tienes que cargarlo en soledad."], mission: "breath-4", mood: "apoyo" },
};

const missionTitle = (id: string) => getMissionById(id)?.title ?? "una misión corta";

function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Misión a proponer: con ánimo bien o regular, la del recomendador; si no, la calmante del ánimo. */
export function suggestedMission(feeling: Feeling, ctx: CompanionContext): { missionId: string; why: string | null } {
  const rec = ctx.recommendation;
  if (rec && getMissionById(rec.missionId) && (feeling === "bien" || feeling === "regular")) {
    return { missionId: rec.missionId, why: rec.reason };
  }
  return { missionId: FEELING_REPLY[feeling].mission, why: null };
}

const closeChoice: CompanionChoice = { id: "fin", label: "Gracias, eso es todo", next: { node: "fin" } };
const supportChoice: CompanionChoice = { id: "apoyo", label: "Quiero hablar con alguien", action: { kind: "support" } };

/** Opciones de seguimiento tras responder: misión, por qué, semana, check-in y apoyo. */
function followUps(state: CompanionState, ctx: CompanionContext, exclude: CompanionNode[] = []): CompanionChoice[] {
  const feeling = state.feeling ?? "regular";
  const { missionId } = suggestedMission(feeling, ctx);
  const out: CompanionChoice[] = [{ id: "mision", label: `Vamos: ${missionTitle(missionId)}`, action: { kind: "mission", missionId } }];
  if (ctx.topFactor && !exclude.includes("porque")) out.push({ id: "porque", label: "¿Por qué me siento así?", next: { node: "porque", feeling } });
  if (ctx.forecastSky && !exclude.includes("semana")) out.push({ id: "semana", label: "¿Cómo viene mi semana?", next: { node: "semana", feeling } });
  if (!ctx.checkinToday) out.push({ id: "checkin", label: "Registrar mi día en la brújula", action: { kind: "checkin" } });
  if (feeling === "mal" || feeling === "estresado" || ctx.supportSuggested) out.push(supportChoice);
  out.push(closeChoice);
  return out;
}

/** Un turno de la conversación: lo que dice el héroe y qué puede responder el estudiante. */
export function companionTurn(state: CompanionState, ctx: CompanionContext): CompanionTurn {
  switch (state.node) {
    case "inicio": {
      const lines = [`${greeting(ctx.hour)}, ${ctx.name}. Soy tu ${ctx.archetypeName}.`];
      if (ctx.supportSuggested) lines.push("Tu brújula nota que estos días han sido pesados. Estoy aquí contigo.");
      lines.push("¿Cómo llegas hoy?");
      return {
        lines,
        mood: ctx.supportSuggested ? "apoyo" : "calma",
        choices: FEELINGS.map((f) => ({ id: f.key, label: f.label, next: { node: "sentir", feeling: f.key } })),
      };
    }
    case "sentir": {
      const feeling = state.feeling ?? "regular";
      const reply = FEELING_REPLY[feeling];
      const { missionId, why } = suggestedMission(feeling, ctx);
      const lines = [...reply.lines, `Te propongo «${missionTitle(missionId)}».`];
      if (why) lines.push(why);
      if (feeling === "mal" && (ctx.supportSuggested || ctx.riskLevel === "alto")) {
        lines.push("Si lo necesitas, hablar con alguien de confianza o con Bienestar Universitario es de valientes.");
      }
      return { lines, mood: reply.mood, choices: followUps(state, ctx) };
    }
    case "porque": {
      const key = ctx.topFactor;
      if (!key) return companionTurn({ node: "sentir", feeling: state.feeling }, ctx);
      const lines = [
        `Lo que más mueve tu brújula ahora es: ${FEATURE_LABELS[key].toLowerCase()}.`,
        RECOMMENDATIONS[key],
      ];
      const factorMission = FACTOR_MISSION[key];
      const choices: CompanionChoice[] = factorMission
        ? [{ id: "mision-factor", label: `Probar «${missionTitle(factorMission)}»`, action: { kind: "mission", missionId: factorMission } }]
        : [supportChoice];
      for (const c of followUps(state, ctx, ["porque"])) if (c.id !== "mision" && !choices.some((x) => x.id === c.id)) choices.push(c);
      return { lines, mood: "calma", choices };
    }
    case "semana": {
      const sky = ctx.forecastSky;
      if (!sky) return companionTurn({ node: "sentir", feeling: state.feeling }, ctx);
      const copy = SKY_COPY[sky];
      return {
        lines: [`${copy.title}.`, copy.body],
        mood: sky === "despejado" ? "celebra" : "apoyo",
        choices: followUps(state, ctx, ["semana"]),
      };
    }
    case "fin":
      return {
        lines: [`Aquí estaré cuando quieras volver, ${ctx.name}. Cada paso cuenta.`],
        mood: "celebra",
        choices: [{ id: "cerrar", label: "Hasta pronto", action: { kind: "close" } }],
      };
  }
}
