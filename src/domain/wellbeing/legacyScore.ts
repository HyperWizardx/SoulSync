export type RiskLevel = "bajo" | "moderado" | "alto" | "insuficiente";

export interface WellbeingInput {
  bienestar: number;
  resiliencia: number;
  energia: number;
  claridad: number;
  conexionSocial: number;
  streak: number;
  dailyGoal: number;
  recentMissionCount: number;
  previousMissionCount: number;
}

export interface WellbeingFeature {
  key: string;
  label: string;
  value: number;
  contribution: number;
}

export interface WellbeingPrediction {
  score: number;
  riskLevel: RiskLevel;
  modelVersion: "baseline-logistic-v1";
  featureVersion: "fv1";
  coverage: number;
  features: WellbeingFeature[];
}

const WEIGHTS = {
  bienestar: 0.28,
  resiliencia: 0.18,
  energia: 0.18,
  claridad: 0.16,
  conexionSocial: 0.1,
  engagementDrop: 0.1,
} as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const normalize = (value: number) => clamp01(value / 100);

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

/**
 * Baseline predictivo explicable para el prototipo de tesis.
 * No fue entrenado con un dataset clínico y NO debe interpretarse como diagnóstico.
 * Está aislado para poder reemplazarlo por un modelo ML entrenado y validado.
 */
export function predictWellbeing(input: WellbeingInput): WellbeingPrediction {
  const engagementDrop = input.previousMissionCount > 0
    ? clamp01((input.previousMissionCount - input.recentMissionCount) / input.previousMissionCount)
    : 0;

  const rawFeatures: Array<{ key: string; label: string; value: number; weight: number }> = [
    { key: "bienestar", label: "Bienestar general", value: 1 - normalize(input.bienestar), weight: WEIGHTS.bienestar },
    { key: "resiliencia", label: "Resiliencia", value: 1 - normalize(input.resiliencia), weight: WEIGHTS.resiliencia },
    { key: "energia", label: "Energía", value: 1 - normalize(input.energia), weight: WEIGHTS.energia },
    { key: "claridad", label: "Claridad mental", value: 1 - normalize(input.claridad), weight: WEIGHTS.claridad },
    { key: "conexionSocial", label: "Conexión social", value: 1 - normalize(input.conexionSocial), weight: WEIGHTS.conexionSocial },
    { key: "engagementDrop", label: "Cambio reciente en actividad", value: engagementDrop, weight: WEIGHTS.engagementDrop },
  ];

  const available = rawFeatures.filter((feature) => Number.isFinite(feature.value));
  const weightTotal = available.reduce((sum, feature) => sum + feature.weight, 0);
  const coverage = clamp01(weightTotal / Object.values(WEIGHTS).reduce((a, b) => a + b, 0));

  if (coverage < 0.5) {
    return {
      score: 0,
      riskLevel: "insuficiente",
      modelVersion: "baseline-logistic-v1",
      featureVersion: "fv1",
      coverage,
      features: [],
    };
  }

  const weightedRisk = available.reduce((sum, feature) => {
    return sum + feature.value * (feature.weight / weightTotal);
  }, 0);

  // Logistic transform keeps the output probabilistic while preserving monotonicity.
  const score = clamp01(sigmoid((weightedRisk - 0.5) * 6));
  const riskLevel: RiskLevel = score < 0.35 ? "bajo" : score <= 0.65 ? "moderado" : "alto";

  return {
    score,
    riskLevel,
    modelVersion: "baseline-logistic-v1",
    featureVersion: "fv1",
    coverage,
    features: available
      .map((feature) => ({
        key: feature.key,
        label: feature.label,
        value: feature.value,
        contribution: feature.value * (feature.weight / weightTotal),
      }))
      .sort((a, b) => b.contribution - a.contribution),
  };
}

export function predictionCopy(prediction: WellbeingPrediction) {
  if (prediction.riskLevel === "insuficiente") {
    return {
      title: "Necesitamos más información",
      description: "Aún no hay suficientes señales para generar una estimación responsable.",
    };
  }

  const percent = Math.round(prediction.score * 100);
  if (prediction.riskLevel === "alto") {
    return {
      title: "Señal preventiva alta",
      description: `El modelo estima un ${percent}% de señal de riesgo en los datos disponibles. Esto no es un diagnóstico.`,
    };
  }
  if (prediction.riskLevel === "moderado") {
    return {
      title: "Señal preventiva moderada",
      description: `El modelo estima un ${percent}% de señal de riesgo en los datos disponibles. Observa tu evolución.`,
    };
  }
  return {
    title: "Señal preventiva baja",
    description: `El modelo estima un ${percent}% de señal de riesgo en los datos disponibles.`,
  };
}
