/**
 * Aura del avatar — capa de Dominio (regla pura).
 * Refuerzo positivo: el aura brilla más con días de check-in, días con misiones
 * de autocuidado/reflexión/movimiento y la racha. Nunca castiga: si baja, solo se atenúa.
 */
export type AuraLevel = 0 | 1 | 2 | 3 | 4;

export interface AuraInput {
  /** Días distintos con check-in en los últimos 7 días. */
  checkinDays: number;
  /** Días distintos con misión de autocuidado completada en los últimos 7 días. */
  selfcareDays: number;
  streak: number;
}

export interface AuraState {
  level: AuraLevel;
  name: string;
  /** Intensidad visual 0–1. */
  intensity: number;
  /** Días (máx. 7) en que el usuario se cuidó: check-in o autocuidado. */
  careDays: number;
  message: string;
}

export const AURA_NAMES = ["Apagada", "Chispa", "Brillo", "Radiante", "Luminosa"] as const;

const clampDays = (n: number) => Math.max(0, Math.min(7, Math.floor(Number.isFinite(n) ? n : 0)));

export function computeAura(input: AuraInput, careDays?: number): AuraState {
  const c = clampDays(input.checkinDays);
  const s = clampDays(input.selfcareDays);
  const streak = Math.max(0, Math.min(7, Number.isFinite(input.streak) ? input.streak : 0));
  const points = c + s + streak / 2;
  const level: AuraLevel = points < 2 ? 0 : points < 5 ? 1 : points < 9 ? 2 : points < 13 ? 3 : 4;
  const days = clampDays(careDays ?? Math.max(c, s));
  const message =
    level === 0
      ? "Tu aura espera una chispa: un check-in o una misión de autocuidado."
      : `Tu aura brilla: ${days} ${days === 1 ? "día" : "días"} cuidándote esta semana`;
  return { level, name: AURA_NAMES[level], intensity: level / 4, careDays: days, message };
}
