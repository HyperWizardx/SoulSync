/**
 * Módulo de Predicción de bienestar — SoulSync.
 *
 * IMPORTANTE (académico y ético):
 * Este módulo produce una SEÑAL PREVENTIVA EXPLORATORIA. No es un diagnóstico,
 * no sustituye la evaluación de un profesional de salud mental y no está
 * validado clínicamente. Los pesos del baseline se fijaron por criterio
 * (no fueron aprendidos de un dataset etiquetado).
 */

export const FEATURE_VERSION = "fv1";
export const CONSENT_VERSION = "consent-2026-08-v1";

export type RiskLevel = "bajo" | "moderado" | "alto" | "insuficiente";

/** Un check-in diario autorreportado (escalas 1–5). */
export interface CheckinRecord {
  /** ISO date `YYYY-MM-DD` */
  date: string;
  /** 1 = muy mal, 5 = muy bien */
  mood: number;
  /** 1 = nada de estrés, 5 = estrés muy alto */
  stress: number;
  /** 1 = sin energía, 5 = con mucha energía */
  energy: number;
  /** 1 = aislado, 5 = muy conectado socialmente */
  social: number;
  /** Horas de sueño reportadas, si el usuario las registró */
  sleepHours?: number | null;
}

/** Resultado de una escala de bienestar validada, si el investigador la habilitó. */
export interface ScaleRecord {
  code: string;
  raw: number;
  max: number;
  /** ISO date `YYYY-MM-DD` */
  answeredAt: string;
}

/** Telemetría de uso de la app (no contiene datos sensibles). */
export interface TelemetryInput {
  /** Misiones completadas por fecha `YYYY-MM-DD` */
  missionsByDate: Record<string, number>;
  dailyGoal: number;
  /** ISO date `YYYY-MM-DD` de la última misión completada */
  lastMissionDate?: string | null;
}

export interface PredictionInput {
  /** Fecha de referencia `YYYY-MM-DD` (normalmente hoy) */
  today: string;
  checkins: CheckinRecord[];
  telemetry: TelemetryInput;
  scales?: ScaleRecord[];
}

export type FeatureKey =
  | "moodLow"
  | "moodDecline"
  | "stressHigh"
  | "sleepDeficit"
  | "engagementDrop"
  | "lowAdherence"
  | "socialWithdrawal"
  | "streakBreak"
  | "scaleDistress";

/** Valor de feature normalizado 0–1 donde 1 = mayor señal de riesgo. */
export interface FeatureValue {
  key: FeatureKey;
  /** 0–1, orientado a riesgo. `null` cuando no hay datos. */
  value: number | null;
  available: boolean;
}

export interface FeatureSet {
  featureVersion: string;
  features: Record<FeatureKey, FeatureValue>;
  /** Número de check-ins usados en la ventana de 14 días */
  checkinCount14: number;
}

export interface FactorExplanation {
  key: FeatureKey;
  label: string;
  /** Contribución relativa al score (0–1 sobre el total de peso disponible) */
  contribution: number;
  /** Valor normalizado de la feature */
  value: number;
  direction: "riesgo" | "protector";
  description: string;
}

export interface WellbeingPrediction {
  modelVersion: string;
  featureVersion: string;
  /** Probabilidad exploratoria 0–1. `null` cuando los datos son insuficientes. */
  score: number | null;
  riskLevel: RiskLevel;
  /** Proporción del peso total del modelo cubierta por features disponibles (0–1) */
  coverage: number;
  explanation: FactorExplanation[];
  generatedAt: string;
  /** Motivo cuando `riskLevel === "insuficiente"` */
  insufficientReason?: string;
}

/** Interfaz de inferencia: sustituible por un modelo entrenado con datos reales. */
export interface WellbeingModel {
  modelVersion: string;
  predict(featureSet: FeatureSet): WellbeingPrediction;
}
