import type { RiskLevel, TrendDirection } from "./types";

export type WorldSeason = "calma" | "crecimiento" | "tormenta" | "niebla";

export interface WorldInput {
  /** Tareas completadas hoy */
  tasksToday: number;
  dailyGoal: number;
  /** Tareas completadas en los últimos 7 días */
  tasksLast7: number;
  streak: number;
  level: number;
  checkinToday: boolean;
  /** Índice compuesto de bienestar 0–1 (1 = mejor) de los últimos 7 días */
  wellbeingIndex7: number | null;
  trend: TrendDirection;
  riskLevel: RiskLevel;
}

export interface WorldZone {
  key: string;
  name: string;
  emoji: string;
  /** Nivel requerido para desbloquear */
  requiredLevel: number;
  unlocked: boolean;
  /** Progreso 0–100 derivado de la actividad real */
  progress: number;
  description: string;
}

export interface WorldState {
  vitality: number;
  harmony: number;
  zonesUnlocked: number;
  tasksToday: number;
  dailyGoal: number;
  season: WorldSeason;
  zones: WorldZone[];
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const pct = (n: number) => Math.round(clamp01(n) * 100);

const ZONE_CATALOG = [
  { key: "valle", name: "Valle de la Calma", emoji: "🏔️", requiredLevel: 1, description: "Se ilumina con tus tareas completadas hoy.", categories: ["autocuidado"] as const },
  { key: "bosque", name: "Bosque Interior", emoji: "🌲", requiredLevel: 2, description: "Crece con tus check-ins registrados.", categories: ["reflexion", "cognitivo"] as const },
  { key: "mar", name: "Mar de Emociones", emoji: "🌊", requiredLevel: 5, description: "Refleja tu tendencia emocional reciente.", categories: ["social", "reflexion"] as const },
  { key: "montana", name: "Montaña de Fuerza", emoji: "⛰️", requiredLevel: 10, description: "Se levanta con tus rachas sostenidas.", categories: ["movimiento", "ar"] as const },
] as const;

/**
 * Deriva el estado del Mundo a partir de datos reales (tareas, check-in y
 * señal de bienestar). Función pura: la misma actividad produce el mismo mundo.
 * No usa biométricos ficticios.
 */
export function deriveWorldState(input: WorldInput): WorldState {
  const goal = Math.max(1, input.dailyGoal || 1);
  const dayRatio = clamp01(input.tasksToday / goal);
  const weekRatio = clamp01(input.tasksLast7 / (goal * 7));
  const index = input.wellbeingIndex7;

  const vitality = pct(0.5 * dayRatio + 0.3 * weekRatio + 0.2 * clamp01(input.streak / 7));
  const harmony = pct(
    index === null
      ? 0.4 * weekRatio + (input.checkinToday ? 0.2 : 0)
      : 0.65 * index + 0.25 * weekRatio + (input.checkinToday ? 0.1 : 0),
  );

  let season: WorldSeason = "calma";
  if (input.riskLevel === "insuficiente" || input.trend === "indeterminada") season = "niebla";
  else if (input.riskLevel === "alto" || input.trend === "empeorando") season = "tormenta";
  else if (input.trend === "mejorando") season = "crecimiento";

  const zones: WorldZone[] = ZONE_CATALOG.map((z) => {
    const unlocked = input.level >= z.requiredLevel;
    let progress = 0;
    if (unlocked) {
      if (z.key === "valle") progress = pct(dayRatio);
      else if (z.key === "bosque") progress = pct(input.checkinToday ? Math.max(0.35, weekRatio) : weekRatio);
      else if (z.key === "mar") progress = index === null ? 0 : pct(index);
      else progress = pct(input.streak / 14);
    }
    return { ...z, unlocked, progress };
  });

  return {
    vitality,
    harmony,
    zonesUnlocked: zones.filter((z) => z.unlocked).length,
    tasksToday: input.tasksToday,
    dailyGoal: goal,
    season,
    zones,
  };
}

export const SEASON_COPY: Record<WorldSeason, { label: string; description: string }> = {
  calma: { label: "Estación de calma", description: "Tu mundo se mantiene estable con tu ritmo actual." },
  crecimiento: { label: "Estación de crecimiento", description: "Tus tareas y check-ins recientes están haciendo florecer el mundo." },
  tormenta: { label: "Estación de tormenta", description: "Coincide con una baja en tus indicadores. Una tarea corta ayuda a despejar." },
  niebla: { label: "Estación de niebla", description: "Faltan registros para leer el estado de tu mundo con claridad." },
};
