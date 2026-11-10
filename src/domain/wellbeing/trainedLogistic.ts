/**
 * Brújula entrenada — capa de Dominio (pura).
 * Regresión logística cuyos pesos se aprenden de etiquetas WHO-5 reales partiendo de los pesos
 * expertos (estimación MAP, ver training.ts). Implementa la misma interfaz `WellbeingModel` que el
 * baseline, exige los mismos datos mínimos y explica cada factor, así que no se pierde
 * explicabilidad. Se usa dentro del criterio de decisión (reglas de seguridad, histéresis...).
 */
import { BASELINE_WEIGHTS, INTERCEPT, SLOPE, assessCoverage, sigmoid, toRiskLevel } from "@/domain/wellbeing/baselineLogistic";
import { buildDecisionModel, decisionModel } from "@/domain/wellbeing/decision";
import { FEATURE_DESCRIPTIONS, FEATURE_LABELS } from "@/domain/wellbeing/copy";
import { computeTrend } from "@/domain/wellbeing/trend";
import { FEATURE_VERSION } from "@/domain/wellbeing/types";
import type { FactorExplanation, FeatureKey, FeatureSet, WellbeingModel, WellbeingPrediction } from "@/domain/wellbeing/types";

/** Orden fijo de los indicadores en los vectores del modelo. */
export const FEATURE_KEYS = Object.keys(BASELINE_WEIGHTS) as FeatureKey[];

/** Parámetros de una brújula entrenada (se guardan en `model_versions.params`). */
export interface TrainedParams {
  version: string;
  featureVersion: string;
  bias: number;
  /** Coeficientes en escala logit por indicador (positivo = más riesgo). */
  coef: Record<FeatureKey, number>;
  /** Media de entrenamiento de cada indicador: se usa cuando falta el dato. */
  means: Record<FeatureKey, number>;
  lambda: number;
  n: number;
  positives: number;
  trainedAt: string;
}

/**
 * Pesos expertos llevados a escala logit: con todos los indicadores el baseline calcula
 * z = INTERCEPT + SLOPE·Σ wᵢ·xᵢ, así que el punto de partida es βᵢ = SLOPE·wᵢ y sesgo INTERCEPT.
 */
export function expertPrior(): { bias: number; coef: Record<FeatureKey, number> } {
  const coef = {} as Record<FeatureKey, number>;
  for (const k of FEATURE_KEYS) coef[k] = SLOPE * BASELINE_WEIGHTS[k];
  return { bias: INTERCEPT, coef };
}

/** Vector de entrada: el valor si está disponible; si no, la media de entrenamiento. */
export function featureVector(fs: FeatureSet, means: Record<FeatureKey, number>): number[] {
  return FEATURE_KEYS.map((k) => {
    const f = fs.features[k];
    return f?.available && f.value !== null ? f.value : (means[k] ?? 0);
  });
}

/** Probabilidad de bienestar bajo según los parámetros (sin las reglas del criterio de decisión). */
export function trainedScore(p: Pick<TrainedParams, "bias" | "coef" | "means">, fs: FeatureSet): number {
  const x = featureVector(fs, p.means);
  return sigmoid(p.bias + FEATURE_KEYS.reduce((s, k, i) => s + (p.coef[k] ?? 0) * x[i], 0));
}

/** Explicación por factor: cuánto empuja cada indicador disponible respecto a su media. */
export function explainTrained(fs: FeatureSet, p: Pick<TrainedParams, "coef" | "means">): FactorExplanation[] {
  const parts = FEATURE_KEYS
    .filter((k) => fs.features[k]?.available && fs.features[k].value !== null)
    .map((k) => {
      const value = fs.features[k].value ?? 0;
      return { key: k, value, push: (p.coef[k] ?? 0) * (value - (p.means[k] ?? 0)) };
    });
  const total = parts.reduce((s, x) => s + Math.abs(x.push), 0);
  if (total === 0) return [];
  return parts
    .map((x) => ({
      key: x.key,
      label: FEATURE_LABELS[x.key],
      contribution: Number((Math.abs(x.push) / total).toFixed(4)),
      value: Number(x.value.toFixed(4)),
      direction: (x.push > 0 ? "riesgo" : "protector") as FactorExplanation["direction"],
      description: FEATURE_DESCRIPTIONS[x.key],
    }))
    .sort((a, b) => b.contribution - a.contribution);
}

/** Modelo base entrenado con la misma forma de salida que el baseline experto. */
export function makeTrainedBaseline(p: TrainedParams): WellbeingModel {
  return {
    modelVersion: p.version,
    predict(fs: FeatureSet): WellbeingPrediction {
      const { coverage, insufficientReason } = assessCoverage(fs);
      const { trend, trendDelta } = computeTrend(fs);
      const base = { modelVersion: p.version, featureVersion: fs.featureVersion, coverage, generatedAt: new Date().toISOString(), trend, trendDelta };
      if (insufficientReason) return { ...base, score: null, riskLevel: "insuficiente", explanation: [], insufficientReason };
      const score = Number(trainedScore(p, fs).toFixed(4));
      return { ...base, score, riskLevel: toRiskLevel(score), explanation: explainTrained(fs, p) };
    },
  };
}

/** ¿Los parámetros guardados son utilizables con los indicadores actuales? */
export function isUsableParams(p: unknown): p is TrainedParams {
  if (!p || typeof p !== "object") return false;
  const t = p as Partial<TrainedParams>;
  return t.featureVersion === FEATURE_VERSION && typeof t.bias === "number" && Number.isFinite(t.bias)
    && !!t.coef && !!t.means && FEATURE_KEYS.every((k) => Number.isFinite(t.coef![k]) && Number.isFinite(t.means![k]));
}

/**
 * Modelo activo: la brújula entrenada si hay una activada y es compatible; si no, el criterio
 * experto. Ambos pasan por el mismo criterio de decisión.
 */
export function resolveActiveModel(params: unknown): WellbeingModel {
  return isUsableParams(params) ? buildDecisionModel(makeTrainedBaseline(params), params.version) : decisionModel;
}
