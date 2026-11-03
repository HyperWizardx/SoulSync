/** Recomendaciones accionables: une los factores de riesgo con misiones reales. Dominio puro. */
import type { FactorExplanation, FeatureKey } from "@/domain/wellbeing/types";

export interface MissionSuggestion { missionId: string; title: string; reason: string; }

const MAP: Partial<Record<FeatureKey, MissionSuggestion>> = {
  sleepDeficit: { missionId: "breath-night", title: "Respiración para dormir", reason: "Has dormido menos de lo habitual." },
  stressHigh: { missionId: "breath-box", title: "Respiración cuadrada", reason: "Tu estrés reciente está alto." },
  moodLow: { missionId: "gratitude-3", title: "3 Gratitudes", reason: "Tu ánimo ha estado bajo." },
  moodDecline: { missionId: "journal-1", title: "Diario emocional", reason: "Tu ánimo bajó respecto a la semana anterior." },
  socialWithdrawal: { missionId: "social-message", title: "Mensaje que conecta", reason: "Te has sentido menos conectado." },
  scaleDistress: { missionId: "journal-worry", title: "Descarga de preocupaciones", reason: "Tu última escala muestra malestar." },
  selfcareGap: { missionId: "self-care-ritual", title: "Ritual de autocuidado", reason: "Hace días que no haces autocuidado." },
  engagementDrop: { missionId: "daily-challenge", title: "Reto del día", reason: "Tu actividad bajó; empieza con algo corto." },
  lowAdherence: { missionId: "hydrate", title: "Pausa de hidratación", reason: "Una misión breve ayuda a retomar el ritmo." },
  taskSkipRate: { missionId: "stretch-60", title: "Estiramiento consciente", reason: "Has omitido varias tareas; prueba una de 1 minuto." },
  streakBreak: { missionId: "breath-4", title: "Respiración guiada", reason: "Retoma tu racha con algo sencillo." },
  lateCheckin: { missionId: "breath-night", title: "Respiración para dormir", reason: "Te registras muy tarde por la noche." },
  scheduleIrregularity: { missionId: "screen-break", title: "Descanso de pantalla", reason: "Tus horarios han sido irregulares." },
};

/** Hasta `limit` misiones únicas para los factores de riesgo de mayor contribución. */
export function suggestMissions(explanation: FactorExplanation[], limit = 3): MissionSuggestion[] {
  const out: MissionSuggestion[] = [];
  for (const f of explanation) {
    if (f.direction !== "riesgo") continue;
    const s = MAP[f.key];
    if (s && !out.some((o) => o.missionId === s.missionId)) out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}
