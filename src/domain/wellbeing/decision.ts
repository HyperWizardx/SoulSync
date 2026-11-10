/**
 * Criterio de decisión v4 — capa de Dominio (pura).
 * Envuelve al baseline logístico y añade: línea base personal, factores
 * protectores, contexto académico, reglas de seguridad, confianza e histéresis.
 * Sigue siendo una señal preventiva exploratoria, no un diagnóstico.
 */
import { baselineLogisticModel, toRiskLevel } from "@/domain/wellbeing/baselineLogistic";
import { FEATURE_LABELS } from "@/domain/wellbeing/copy";
import { SEVERE_SCALE_DISTRESS } from "@/domain/wellbeing/who5";
import type {
  CheckinRecord, DecisionContext, FeatureKey, FeatureSet, RiskLevel, SafetyFlag,
  SignalConfidence, WellbeingModel, WellbeingPrediction,
} from "@/domain/wellbeing/types";

export const DECISION_MODEL_VERSION = "decision-v4";

const DAY = 86_400_000;
const daysAgo = (date: string, today: string) => (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY;
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v: number[]) => { const m = mean(v); return Math.sqrt(mean(v.map((x) => (x - m) ** 2))); };
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const val = (fs: FeatureSet, k: FeatureKey) => (fs.features[k]?.available ? (fs.features[k].value ?? 0) : null);

export interface PersonalBaseline { moodMean: number; moodSd: number; stressMean: number; stressSd: number; days: number; }

/** Línea base personal: días 8–28 atrás; requiere al menos 5 registros. */
export function computePersonalBaseline(checkins: CheckinRecord[], today: string): PersonalBaseline | null {
  const hist = checkins.filter((c) => { const d = daysAgo(c.date, today); return d >= 7 && d < 28; });
  if (hist.length < 5) return null;
  return {
    moodMean: mean(hist.map((c) => c.mood)), moodSd: Math.max(0.5, sd(hist.map((c) => c.mood))),
    stressMean: mean(hist.map((c) => c.stress)), stressSd: Math.max(0.5, sd(hist.map((c) => c.stress))),
    days: hist.length,
  };
}

/** Desviación respecto a uno mismo: + si la semana es peor que su normal (máx ±0.10). */
export function personalAdjustment(checkins: CheckinRecord[], today: string): number {
  const base = computePersonalBaseline(checkins, today);
  const recent = checkins.filter((c) => { const d = daysAgo(c.date, today); return d >= 0 && d < 7; });
  if (!base || recent.length === 0) return 0;
  const zMood = (base.moodMean - mean(recent.map((c) => c.mood))) / base.moodSd;
  const zStress = (mean(recent.map((c) => c.stress)) - base.stressMean) / base.stressSd;
  return Number(clamp(((zMood + zStress) / 2) * 0.05, -0.1, 0.1).toFixed(4));
}

/** Reglas de seguridad: combinaciones críticas que priorizan revisión. */
export function evaluateSafetyRules(fs: FeatureSet): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  const stress = val(fs, "stressHigh"), sleep = val(fs, "sleepDeficit"), social = val(fs, "socialWithdrawal");
  if (stress !== null && sleep !== null && social !== null && stress >= 0.75 && sleep >= 0.6 && social >= 0.6) flags.push("triada_estres_sueno_aislamiento");
  const scale = val(fs, "scaleDistress");
  if (scale !== null && scale >= SEVERE_SCALE_DISTRESS) flags.push("escala_severa"); // = WHO-5 bruto ≤ 7
  const mood = val(fs, "moodLow"), decline = val(fs, "moodDecline");
  if (mood !== null && decline !== null && mood >= 0.85 && decline >= 0.5) flags.push("animo_muy_bajo_sostenido");
  return flags;
}

const PROTECTIVE_RULES: { key: FeatureKey; max: number }[] = [
  { key: "selfcareGap", max: 0.2 },
  { key: "lowAdherence", max: 0.3 },
  { key: "socialWithdrawal", max: 0.25 },
  { key: "taskSkipRate", max: 0.15 },
];

/** Factores protectores presentes y su reducción (0.025 c/u, máx 0.08). */
export function protectiveFactors(fs: FeatureSet) {
  const found = PROTECTIVE_RULES.filter((r) => { const v = val(fs, r.key); return v !== null && v <= r.max; })
    .map((r) => ({ key: r.key, label: FEATURE_LABELS[r.key] }));
  return { factors: found, reduction: Math.min(0.08, found.length * 0.025) };
}

/** Atenuación por periodo de parciales: estrés situacional pesa menos. */
export function academicAdjustment(fs: FeatureSet, examPeriod: boolean | undefined): number {
  const stress = val(fs, "stressHigh");
  return examPeriod && stress !== null ? Number((0.06 * stress).toFixed(4)) : 0;
}

export function signalConfidence(checkinCount14: number, coverage: number): SignalConfidence {
  if (checkinCount14 >= 8 && coverage >= 0.75) return "alta";
  if (checkinCount14 >= 5 && coverage >= 0.6) return "media";
  return "baja";
}

/**
 * Histéresis: subir a Alto exige señal elevada previa (Moderado/Alto);
 * bajar desde Alto pasa primero por Moderado.
 */
export function applyHysteresis(level: RiskLevel, previous: RiskLevel[] | undefined): { level: RiskLevel; mode: "ninguna" | "contenida" | "sostenida" } {
  const last = previous?.find((l) => l !== "insuficiente");
  if (level === "alto" && last !== "alto" && last !== "moderado") return { level: "moderado", mode: "contenida" };
  if (level === "bajo" && last === "alto") return { level: "moderado", mode: "sostenida" };
  return { level, mode: "ninguna" };
}

/**
 * Crea el criterio de decisión sobre un modelo base (el baseline experto o una brújula entrenada).
 * Las reglas de seguridad, la línea base personal, los protectores, el contexto académico y la
 * histéresis son las mismas para cualquier modelo base.
 */
export function buildDecisionModel(baseModel: WellbeingModel, modelVersion: string): WellbeingModel {
  return {
  modelVersion,
  predict(fs: FeatureSet, ctx: DecisionContext = {}): WellbeingPrediction {
    const base = baseModel.predict(fs);
    const confidence = signalConfidence(fs.checkinCount14, base.coverage);
    if (base.score === null) return { ...base, modelVersion, rawScore: null, confidence: "baja", safetyFlags: [], protectiveFactors: [] };

    const personal = ctx.checkins && ctx.today ? personalAdjustment(ctx.checkins, ctx.today) : 0;
    const protective = protectiveFactors(fs);
    const academic = academicAdjustment(fs, ctx.examPeriod);
    const score = Number(clamp(base.score + personal - protective.reduction - academic, 0, 1).toFixed(4));
    const safetyFlags = evaluateSafetyRules(fs);

    let { level, mode } = applyHysteresis(toRiskLevel(score), ctx.previousLevels);
    if (safetyFlags.length > 0) { level = "alto"; mode = "ninguna"; }

    return {
      ...base,
      modelVersion,
      rawScore: base.score,
      score,
      riskLevel: level,
      confidence,
      safetyFlags,
      protectiveFactors: protective.factors,
      adjustments: { personal, protective: -protective.reduction, academic: -academic, hysteresis: mode },
    };
  },
  };
}

/** Criterio experto (decision-v4 sobre baseline-logistic-v3): el modelo por defecto. */
export const decisionModel: WellbeingModel = buildDecisionModel(baselineLogisticModel, DECISION_MODEL_VERSION);

export const SAFETY_FLAG_COPY: Record<SafetyFlag, string> = {
  triada_estres_sueno_aislamiento: "Estrés alto, poco sueño y aislamiento a la vez",
  escala_severa: "Puntaje elevado en la escala validada",
  animo_muy_bajo_sostenido: "Ánimo muy bajo y en descenso",
};

export const CONFIDENCE_COPY: Record<SignalConfidence, string> = {
  alta: "Confianza alta",
  media: "Confianza media",
  baja: "Señal preliminar",
};
