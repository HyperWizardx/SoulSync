/**
 * "¿Y si…?" del estudiante — capa de Aplicación.
 * Parte de los indicadores de SU brújula de hoy, aplica hábitos que él mismo puede cambiar
 * (dormir, pausas para el estrés, cumplir su meta, hablar con alguien, rutina) y ejecuta el
 * MISMO modelo activo antes y después. No guarda nada y solo muestra la dirección del cambio.
 */
import { buildFeatureSet, SIM_FEATURES, simulate, type Scenario } from "@/application/research/simulate";
import type { FactorExplanation, FeatureKey, WellbeingModel } from "@/domain/wellbeing/types";

export type LeverKey = "sueno" | "estres" | "meta" | "social" | "rutina";

export interface Lever { key: LeverKey; label: string; hint: string; features: FeatureKey[] }

export const LEVERS: Lever[] = [
  { key: "sueno", label: "Dormir 7 horas o más", hint: "y hacer tu check-in antes de medianoche", features: ["sleepDeficit", "lateCheckin"] },
  { key: "estres", label: "Una pausa de respiración al día", hint: "3 minutos cuando sientas tensión", features: ["stressHigh", "responseLatency"] },
  { key: "meta", label: "Cumplir tu meta de misiones", hint: "aunque sean misiones cortas", features: ["lowAdherence", "taskSkipRate", "selfcareGap", "engagementDrop", "streakBreak"] },
  { key: "social", label: "Hablar con alguien cercano", hint: "un mensaje o una conversación cuenta", features: ["socialWithdrawal"] },
  { key: "rutina", label: "Check-in a la misma hora", hint: "una rutina estable ayuda a tu descanso", features: ["scheduleIrregularity"] },
];

/** Cuánto se reduce cada indicador al adoptar el hábito (supuesto orientativo, no una promesa). */
export const LEVER_EFFECT = 0.6;
/** Por debajo de este valor el hábito ya está bien encaminado. */
export const ALREADY_GOOD = 0.15;

/** Escenario de partida: los valores de los indicadores disponibles hoy en la brújula. */
export function scenarioFromExplanation(explanation: readonly Pick<FactorExplanation, "key" | "value">[]): Scenario {
  const s: Scenario = {};
  for (const k of SIM_FEATURES) s[k] = null;
  for (const f of explanation) s[f.key] = f.value;
  return s;
}

/** Hábitos que aplican: al menos un indicador disponible; `good` si ya están bajos. */
export function availableLevers(base: Scenario): { lever: Lever; good: boolean }[] {
  return LEVERS
    .map((lever) => {
      const vals = lever.features.map((k) => base[k]).filter((v): v is number => typeof v === "number");
      return vals.length ? { lever, good: vals.every((v) => v <= ALREADY_GOOD) } : null;
    })
    .filter((x): x is { lever: Lever; good: boolean } => x !== null);
}

export function applyLevers(base: Scenario, active: ReadonlySet<LeverKey>): Scenario {
  const out: Scenario = { ...base };
  for (const lever of LEVERS) {
    if (!active.has(lever.key)) continue;
    for (const k of lever.features) {
      const v = out[k];
      if (typeof v === "number") out[k] = Number((v * (1 - LEVER_EFFECT)).toFixed(4));
    }
  }
  return out;
}

export interface WhatIfResult {
  before: number | null;
  after: number | null;
  /** Puntos del índice (0–100) que bajaría: positivo = la brújula mejora. */
  improvement: number;
  afterLevel: string;
}

export function runWhatIf(model: WellbeingModel, base: Scenario, active: ReadonlySet<LeverKey>, checkinCount14 = 7): WhatIfResult {
  const before = simulate(base, checkinCount14, model);
  const after = model.predict(buildFeatureSet(applyLevers(base, active), checkinCount14));
  const b = before.score, a = after.score;
  return {
    before: b,
    after: a,
    improvement: b === null || a === null ? 0 : Math.max(0, Math.round((b - a) * 100)),
    afterLevel: after.riskLevel,
  };
}
