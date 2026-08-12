import { explainContributions } from "./explain";
import { computeTrend } from "./trend";
import type { FeatureKey, FeatureSet, WellbeingModel, WellbeingPrediction, RiskLevel } from "./types";

export const BASELINE_MODEL_VERSION = "baseline-logistic-v2";

/**
 * Pesos definidos por CRITERIO (revisión conceptual de la propuesta de tesis),
 * NO aprendidos de un dataset etiquetado. Suman 1.0 para facilitar lectura.
 * Al entrenar un modelo real, se sustituye toda esta implementación
 * manteniendo la interfaz `WellbeingModel`.
 */
export const BASELINE_WEIGHTS: Record<FeatureKey, number> = {
  moodLow: 0.18,
  moodDecline: 0.11,
  stressHigh: 0.17,
  sleepDeficit: 0.10,
  socialWithdrawal: 0.09,
  scaleDistress: 0.09,
  engagementDrop: 0.06,
  lowAdherence: 0.05,
  streakBreak: 0.03,
  taskSkipRate: 0.07,
  selfcareGap: 0.05,
};

/** Pendiente e intercepto del enlace logístico: índice 0.5 → probabilidad 0.5. */
const INTERCEPT = -3.2;
const SLOPE = 6.4;

/** Cobertura mínima de peso disponible y check-ins mínimos para emitir señal. */
export const MIN_COVERAGE = 0.45;
export const MIN_CHECKINS = 3;

export const THRESHOLD_MODERADO = 0.35;
export const THRESHOLD_ALTO = 0.65;

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export function toRiskLevel(score: number): RiskLevel {
  if (score >= THRESHOLD_ALTO) return "alto";
  if (score >= THRESHOLD_MODERADO) return "moderado";
  return "bajo";
}

export const baselineLogisticModel: WellbeingModel = {
  modelVersion: BASELINE_MODEL_VERSION,
  predict(featureSet: FeatureSet): WellbeingPrediction {
    const generatedAt = new Date().toISOString();
    const entries = Object.values(featureSet.features);

    const totalWeight = entries.reduce((s, f) => s + (BASELINE_WEIGHTS[f.key] ?? 0), 0);
    const availableWeight = entries
      .filter((f) => f.available)
      .reduce((s, f) => s + (BASELINE_WEIGHTS[f.key] ?? 0), 0);
    const coverage = totalWeight === 0 ? 0 : Number((availableWeight / totalWeight).toFixed(4));

    const { trend, trendDelta } = computeTrend(featureSet);

    const base = {
      modelVersion: BASELINE_MODEL_VERSION,
      featureVersion: featureSet.featureVersion,
      coverage,
      generatedAt,
      trend,
      trendDelta,
    };

    if (featureSet.checkinCount14 < MIN_CHECKINS) {
      return {
        ...base,
        score: null,
        riskLevel: "insuficiente",
        explanation: [],
        insufficientReason: `Se requieren al menos ${MIN_CHECKINS} check-ins en los últimos 14 días (tienes ${featureSet.checkinCount14}).`,
      };
    }

    if (coverage < MIN_COVERAGE || availableWeight === 0) {
      return {
        ...base,
        score: null,
        riskLevel: "insuficiente",
        explanation: [],
        insufficientReason: "Cobertura de indicadores insuficiente para una estimación estable.",
      };
    }

    // Índice ponderado 0–1 sobre las features disponibles.
    const index =
      entries
        .filter((f) => f.available)
        .reduce((s, f) => s + (BASELINE_WEIGHTS[f.key] ?? 0) * (f.value ?? 0), 0) / availableWeight;

    const score = Number(sigmoid(INTERCEPT + SLOPE * index).toFixed(4));

    return {
      ...base,
      score,
      riskLevel: toRiskLevel(score),
      explanation: explainContributions(featureSet, BASELINE_WEIGHTS),
    };
  },
};
