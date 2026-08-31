/**
 * Módulo de Predicción de bienestar — SoulSync.
 *
 * IMPORTANTE (académico y ético):
 * Este módulo produce una SEÑAL PREVENTIVA EXPLORATORIA. No es un diagnóstico,
 * no sustituye la evaluación de un profesional de salud mental y no está
 * validado clínicamente. Los pesos del baseline se fijaron por criterio
 * (no fueron aprendidos de un dataset etiquetado).
 */
export const FEATURE_VERSION = "fv3";
export const CONSENT_VERSION = "consent-2026-08-v1";
export type RiskLevel = "bajo" | "moderado" | "alto" | "insuficiente";
export interface CheckinRecord { date: string; mood: number; stress: number; energy: number; social: number; sleepHours?: number | null; }
export interface ScaleRecord { code: string; raw: number; max: number; answeredAt: string; }
export interface TelemetryInput { missionsByDate: Record<string, number>; dailyGoal: number; lastMissionDate?: string | null; }
export type TaskStatus = "assigned" | "started" | "completed" | "skipped";
export type TaskCategory = "autocuidado" | "reflexion" | "movimiento" | "social" | "cognitivo" | "ar";
export interface TaskEventRecord { date: string; missionId: string; status: TaskStatus; category: TaskCategory; durationSeconds: number; }
export interface UserStatsInput { bienestar: number; resiliencia: number; energia: number; claridad: number; }
export interface PredictionInput { today: string; checkins: CheckinRecord[]; telemetry: TelemetryInput; scales?: ScaleRecord[]; taskEvents?: TaskEventRecord[]; stats?: UserStatsInput; }
export type FeatureKey = "moodLow" | "moodDecline" | "stressHigh" | "sleepDeficit" | "engagementDrop" | "lowAdherence" | "socialWithdrawal" | "streakBreak" | "scaleDistress" | "taskSkipRate" | "selfcareGap" | "statBienestarBajo" | "statResilienciaBaja" | "statEnergiaBaja" | "statClaridadBaja";
export interface FeatureValue { key: FeatureKey; value: number | null; available: boolean; }
export type TrendDirection = "mejorando" | "estable" | "empeorando" | "indeterminada";
export interface FeatureSet { featureVersion: string; features: Record<FeatureKey, FeatureValue>; checkinCount14: number; wellbeingIndex7: number | null; wellbeingIndexPrev7: number | null; }
export interface FactorExplanation { key: FeatureKey; label: string; contribution: number; value: number; direction: "riesgo" | "protector"; description: string; }
export interface WellbeingPrediction { modelVersion: string; featureVersion: string; score: number | null; riskLevel: RiskLevel; coverage: number; explanation: FactorExplanation[]; generatedAt: string; trend: TrendDirection; trendDelta: number; insufficientReason?: string; }
export interface WellbeingModel { modelVersion: string; predict(featureSet: FeatureSet): WellbeingPrediction; }
