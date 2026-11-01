/**
 * Simulador "¿y si...?" — capa de Aplicación.
 * Construye un conjunto de indicadores hipotético y ejecuta el MISMO modelo activo.
 * No persiste nada: es una herramienta exploratoria de explicabilidad.
 */
import { activeModel } from "@/domain/wellbeing/inference";
import { FEATURE_VERSION } from "@/domain/wellbeing/types";
import type { FeatureKey, FeatureSet, WellbeingModel, WellbeingPrediction } from "@/domain/wellbeing/types";

export const SIM_FEATURES: FeatureKey[] = [
  "moodLow", "moodDecline", "stressHigh", "sleepDeficit", "socialWithdrawal", "scaleDistress",
  "engagementDrop", "lowAdherence", "streakBreak", "taskSkipRate", "selfcareGap",
  "lateCheckin", "scheduleIrregularity", "responseLatency",
];

/** Valor 0–1 por indicador, o null si se simula como "no disponible". */
export type Scenario = Partial<Record<FeatureKey, number | null>>;

export function buildFeatureSet(scenario: Scenario, checkinCount14 = 7): FeatureSet {
  const features = {} as FeatureSet["features"];
  for (const key of SIM_FEATURES) {
    const v = scenario[key];
    features[key] =
      v === null || v === undefined
        ? { key, value: null, available: false }
        : { key, value: Math.max(0, Math.min(1, v)), available: true };
  }
  return { featureVersion: FEATURE_VERSION, features, checkinCount14, wellbeingIndex7: null, wellbeingIndexPrev7: null };
}

export function simulate(scenario: Scenario, checkinCount14 = 7, model: WellbeingModel = activeModel): WellbeingPrediction {
  return model.predict(buildFeatureSet(scenario, checkinCount14));
}

export const PRESETS: { key: string; label: string; scenario: Scenario }[] = [
  {
    key: "parciales",
    label: "Semana de parciales",
    scenario: { moodLow: 0.55, moodDecline: 0.4, stressHigh: 0.85, sleepDeficit: 0.7, socialWithdrawal: 0.4, engagementDrop: 0.3, lowAdherence: 0.6, streakBreak: 0.2, taskSkipRate: 0.5, selfcareGap: 0.7, lateCheckin: 0.6, scheduleIrregularity: 0.6, responseLatency: 0.3 },
  },
  {
    key: "estable",
    label: "Estudiante estable",
    scenario: { moodLow: 0.2, moodDecline: 0, stressHigh: 0.25, sleepDeficit: 0.1, socialWithdrawal: 0.2, engagementDrop: 0, lowAdherence: 0.2, streakBreak: 0, taskSkipRate: 0.1, selfcareGap: 0.15, lateCheckin: 0, scheduleIrregularity: 0.1, responseLatency: 0 },
  },
  {
    key: "aislamiento",
    label: "Aislamiento",
    scenario: { moodLow: 0.7, moodDecline: 0.6, stressHigh: 0.5, sleepDeficit: 0.4, socialWithdrawal: 0.9, engagementDrop: 0.7, lowAdherence: 0.85, streakBreak: 0.8, taskSkipRate: 0.6, selfcareGap: 0.85, lateCheckin: 0.3, scheduleIrregularity: 0.4, responseLatency: 0.5 },
  },
];
