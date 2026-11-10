/**
 * Actividad física semanal según la OMS (Directrices 2020) — capa de Dominio (pura).
 * Adultos: 150–300 min/semana de actividad moderada, o 75–150 de vigorosa, o una combinación
 * equivalente (1 min vigoroso = 2 min moderados), y fortalecimiento muscular 2 o más días.
 * La semana va de lunes a domingo.
 */
export const WHO_WEEKLY_MINUTES = 150;
export const WHO_STRENGTH_DAYS = 2;

export type Intensity = "moderada" | "vigorosa";

export interface ActivityLog {
  date: string;        // YYYY-MM-DD
  minutes: number;
  intensity: Intensity;
  strength: boolean;   // incluyó ejercicios de fuerza
}

export interface ActivityWeek {
  weekStart: string;          // lunes de la semana (YYYY-MM-DD)
  equivalentMinutes: number;  // moderados + 2 × vigorosos
  strengthDays: number;
  activeDays: number;
  goalMet: boolean;           // ≥ 150 min equivalentes
  strengthMet: boolean;       // ≥ 2 días de fuerza
  percent: number;            // 0–100 hacia los 150 min
}

/** Lunes (YYYY-MM-DD) de la semana de una fecha. */
export function weekStart(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7; // lunes = 0
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

/** Minutos equivalentes de un registro (vigorosos cuentan doble). */
export const equivalentMinutes = (log: Pick<ActivityLog, "minutes" | "intensity">) =>
  log.intensity === "vigorosa" ? log.minutes * 2 : log.minutes;

/** Resumen de la semana que contiene `today`. */
export function summarizeWeek(logs: readonly ActivityLog[], today: string): ActivityWeek {
  const start = weekStart(today);
  const inWeek = logs.filter((l) => weekStart(l.date) === start && l.date <= today);
  const equivalent = inWeek.reduce((s, l) => s + equivalentMinutes(l), 0);
  const strengthDays = new Set(inWeek.filter((l) => l.strength).map((l) => l.date)).size;
  const activeDays = new Set(inWeek.map((l) => l.date)).size;
  return {
    weekStart: start,
    equivalentMinutes: equivalent,
    strengthDays,
    activeDays,
    goalMet: equivalent >= WHO_WEEKLY_MINUTES,
    strengthMet: strengthDays >= WHO_STRENGTH_DAYS,
    percent: Math.min(100, Math.round((equivalent / WHO_WEEKLY_MINUTES) * 100)),
  };
}

/** Cuántas semanas distintas alcanzaron la meta de 150 min (para logros). */
export function weeksWithGoal(logs: readonly ActivityLog[]): number {
  const byWeek = new Map<string, number>();
  for (const l of logs) byWeek.set(weekStart(l.date), (byWeek.get(weekStart(l.date)) ?? 0) + equivalentMinutes(l));
  return [...byWeek.values()].filter((m) => m >= WHO_WEEKLY_MINUTES).length;
}

/** Ejemplos para elegir la intensidad (prueba del habla de la OMS: moderada = puedes hablar, no cantar). */
export const INTENSITY_HINT: Record<Intensity, string> = {
  moderada: "Caminar rápido, bailar, montar bici tranquilo: puedes hablar pero no cantar.",
  vigorosa: "Correr, fútbol, nadar rápido: te cuesta decir más de unas palabras.",
};
