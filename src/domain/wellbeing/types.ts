/**
 * Módulo de Predicción de bienestar — SoulSync.
 *
 * IMPORTANTE (académico y ético):
 * Este módulo produce una SEÑAL PREVENTIVA EXPLORATORIA. No es un diagnóstico,
 * no sustituye la evaluación de un profesional de salud mental y no está
 * validado clínicamente. Los pesos del baseline se fijaron por criterio
 * (no fueron aprendidos de un dataset etiquetado).
 */
export const FEATURE_VERSION = "fv4";
// v2 (nov 2026): añade el pergamino WHO-5, la actividad física y el entrenamiento de modelos propios.
export const CONSENT_VERSION = "consent-2026-11-v2";
export type RiskLevel = "bajo" | "moderado" | "alto" | "insuficiente";
export interface CheckinRecord { date: string; mood: number; stress: number; energy: number; social: number; sleepHours?: number | null; localHour?: number | null; responseSeconds?: number | null; }
export interface ScaleRecord { code: string; raw: number; max: number; answeredAt: string; }
export interface TelemetryInput { missionsByDate: Record<string, number>; dailyGoal: number; lastMissionDate?: string | null; }
export type TaskStatus = "assigned" | "started" | "completed" | "skipped";
export type TaskCategory = "autocuidado" | "reflexion" | "movimiento" | "social" | "cognitivo" | "ar";
export interface TaskEventRecord { date: string; missionId: string; status: TaskStatus; category: TaskCategory; durationSeconds: number; }
export interface UserStatsInput { bienestar: number; resiliencia: number; energia: number; claridad: number; }
export interface PredictionInput { today: string; checkins: CheckinRecord[]; telemetry: TelemetryInput; scales?: ScaleRecord[]; taskEvents?: TaskEventRecord[]; stats?: UserStatsInput; }
export type FeatureKey = "moodLow" | "moodDecline" | "stressHigh" | "sleepDeficit" | "engagementDrop" | "lowAdherence" | "socialWithdrawal" | "streakBreak" | "scaleDistress" | "taskSkipRate" | "selfcareGap" | "lateCheckin" | "scheduleIrregularity" | "responseLatency";
export interface FeatureValue { key: FeatureKey; value: number | null; available: boolean; }
export type TrendDirection = "mejorando" | "estable" | "empeorando" | "indeterminada";
export interface FeatureSet { featureVersion: string; features: Record<FeatureKey, FeatureValue>; checkinCount14: number; wellbeingIndex7: number | null; wellbeingIndexPrev7: number | null; }
export interface FactorExplanation { key: FeatureKey; label: string; contribution: number; value: number; direction: "riesgo" | "protector"; description: string; }
export type SignalConfidence = "alta" | "media" | "baja";
export type SafetyFlag = "triada_estres_sueno_aislamiento" | "escala_severa" | "animo_muy_bajo_sostenido";
/** Ajustes del criterio de decisión (v4) sobre el índice base, en puntos de score (0–1). */
export interface DecisionAdjustments { personal: number; protective: number; academic: number; hysteresis: "ninguna" | "contenida" | "sostenida"; }
export interface WellbeingPrediction { modelVersion: string; featureVersion: string; score: number | null; riskLevel: RiskLevel; coverage: number; explanation: FactorExplanation[]; generatedAt: string; trend: TrendDirection; trendDelta: number; insufficientReason?: string; rawScore?: number | null; confidence?: SignalConfidence; safetyFlags?: SafetyFlag[]; protectiveFactors?: { key: FeatureKey; label: string }[]; adjustments?: DecisionAdjustments; }
/** Contexto opcional para decidir: historia de niveles (más reciente primero), periodo académico y check-ins para la línea base personal. */
export interface DecisionContext { previousLevels?: RiskLevel[]; examPeriod?: boolean; checkins?: CheckinRecord[]; today?: string; }
export interface WellbeingModel { modelVersion: string; predict(featureSet: FeatureSet, context?: DecisionContext): WellbeingPrediction; }
