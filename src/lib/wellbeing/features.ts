import type {
  FeatureKey,
  FeatureSet,
  FeatureValue,
  PredictionInput,
} from "./types";
import { FEATURE_VERSION } from "./types";

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Días de diferencia entre dos fechas ISO `YYYY-MM-DD`. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  return Math.round((b - a) / 86_400_000);
}

function inWindow(date: string, today: string, startDaysAgo: number, endDaysAgo: number) {
  const d = daysBetween(date, today);
  if (Number.isNaN(d) || d < 0) return false;
  return d >= endDaysAgo && d < startDaysAgo;
}

const mean = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((s, v) => s + v, 0) / values.length;

/** Escala 1–5 invertida a riesgo 0–1 (1 → 1 de riesgo, 5 → 0). */
const invertedLikert = (v: number) => clamp01((5 - clamp(v, 1, 5)) / 4);
/** Escala 1–5 directa a riesgo 0–1 (5 → 1 de riesgo). */
const directLikert = (v: number) => clamp01((clamp(v, 1, 5) - 1) / 4);

const unavailable = (key: FeatureKey): FeatureValue => ({ key, value: null, available: false });
const available = (key: FeatureKey, value: number): FeatureValue => ({
  key,
  value: clamp01(value),
  available: true,
});

function sumMissions(
  missionsByDate: Record<string, number>,
  today: string,
  startDaysAgo: number,
  endDaysAgo: number,
) {
  let total = 0;
  for (const [date, count] of Object.entries(missionsByDate)) {
    if (inWindow(date, today, startDaysAgo, endDaysAgo)) total += Math.max(0, count);
  }
  return total;
}

/**
 * Extrae y normaliza las features del modelo. Función pura y determinista:
 * mismo input → mismo output. No accede a la base de datos ni a texto libre.
 */
export function extractFeatures(input: PredictionInput): FeatureSet {
  const { today, checkins, telemetry } = input;

  const valid = checkins.filter((c) => {
    const d = daysBetween(c.date, today);
    return !Number.isNaN(d) && d >= 0;
  });
  const last7 = valid.filter((c) => inWindow(c.date, today, 7, 0));
  const prev7 = valid.filter((c) => inWindow(c.date, today, 14, 7));
  const last14 = valid.filter((c) => inWindow(c.date, today, 14, 0));

  const features = {} as Record<FeatureKey, FeatureValue>;

  // --- Ánimo ---
  const mood7 = mean(last7.map((c) => c.mood));
  features.moodLow = mood7 === null ? unavailable("moodLow") : available("moodLow", invertedLikert(mood7));

  const moodPrev7 = mean(prev7.map((c) => c.mood));
  features.moodDecline =
    mood7 === null || moodPrev7 === null
      ? unavailable("moodDecline")
      : available("moodDecline", clamp01((moodPrev7 - mood7) / 2));

  // --- Estrés autorreportado ---
  const stress7 = mean(last7.map((c) => c.stress));
  features.stressHigh = stress7 === null ? unavailable("stressHigh") : available("stressHigh", directLikert(stress7));

  // --- Sueño (solo si hay reportes reales) ---
  const sleepValues = last7
    .map((c) => c.sleepHours)
    .filter((h): h is number => typeof h === "number" && Number.isFinite(h));
  const sleep7 = mean(sleepValues);
  features.sleepDeficit =
    sleep7 === null ? unavailable("sleepDeficit") : available("sleepDeficit", clamp01((7 - sleep7) / 4));

  // --- Telemetría de uso ---
  const missions7 = sumMissions(telemetry.missionsByDate, today, 7, 0);
  const missionsPrev7 = sumMissions(telemetry.missionsByDate, today, 14, 7);
  features.engagementDrop =
    missionsPrev7 === 0
      ? unavailable("engagementDrop")
      : available("engagementDrop", clamp01((missionsPrev7 - missions7) / missionsPrev7));

  const goal = Math.max(1, telemetry.dailyGoal || 1);
  features.lowAdherence = available("lowAdherence", 1 - clamp01(missions7 / (goal * 7)));

  // --- Conexión social autorreportada ---
  const social7 = mean(last7.map((c) => c.social));
  features.socialWithdrawal =
    social7 === null ? unavailable("socialWithdrawal") : available("socialWithdrawal", invertedLikert(social7));

  // --- Inactividad / ruptura de racha ---
  if (!telemetry.lastMissionDate) {
    features.streakBreak = available("streakBreak", 1);
  } else {
    const gap = daysBetween(telemetry.lastMissionDate, today);
    features.streakBreak = Number.isNaN(gap)
      ? unavailable("streakBreak")
      : available("streakBreak", clamp01((gap - 1) / 4));
  }

  // --- Escalas validadas (solo si existen registros reales) ---
  const recentScale = (input.scales ?? [])
    .filter((s) => {
      const d = daysBetween(s.answeredAt, today);
      return !Number.isNaN(d) && d >= 0 && d <= 30 && s.max > 0;
    })
    .sort((a, b) => (a.answeredAt < b.answeredAt ? 1 : -1))[0];
  features.scaleDistress = recentScale
    ? available("scaleDistress", clamp01(recentScale.raw / recentScale.max))
    : unavailable("scaleDistress");

  // --- Tareas diarias: omisión y hueco de autocuidado ---
  const events = (input.taskEvents ?? []).filter((e) => inWindow(e.date, today, 14, 0));
  const events7 = events.filter((e) => inWindow(e.date, today, 7, 0));
  const completed7 = events7.filter((e) => e.status === "completed").length;
  const skipped7 = events7.filter((e) => e.status === "skipped").length;
  const decided7 = completed7 + skipped7;
  features.taskSkipRate =
    decided7 === 0 ? unavailable("taskSkipRate") : available("taskSkipRate", skipped7 / decided7);

  if (events.length === 0) {
    features.selfcareGap = unavailable("selfcareGap");
  } else {
    const selfcareDays = new Set(
      events7
        .filter((e) => e.status === "completed" && SELFCARE_CATEGORIES.has(e.category))
        .map((e) => e.date),
    );
    features.selfcareGap = available("selfcareGap", (7 - Math.min(7, selfcareDays.size)) / 7);
  }

  // --- Índice compuesto de bienestar por ventana (autorreporte + cumplimiento) ---
  const windowIndex = (window: typeof last7, missions: number): number | null => {
    if (window.length === 0) return null;
    const selfReport =
      mean(
        window.map(
          (c) =>
            (invert(c.mood) + directOk(5 - c.stress + 1) + invert(c.energy) + invert(c.social)) / 4,
        ),
      ) ?? 0;
    const adherence = clamp01(missions / (goal * 7));
    return clamp01(0.7 * selfReport + 0.3 * adherence);
  };

  return {
    featureVersion: FEATURE_VERSION,
    features,
    checkinCount14: last14.length,
    wellbeingIndex7: windowIndex(last7, missions7),
    wellbeingIndexPrev7: windowIndex(prev7, missionsPrev7),
  };
}

/** Categorías que cuentan como práctica de autocuidado sostenida. */
export const SELFCARE_CATEGORIES = new Set(["autocuidado", "reflexion", "movimiento"]);

/** 1–5 → 0–1 donde 5 es mejor. */
const invert = (v: number) => clamp01((clamp(v, 1, 5) - 1) / 4);
/** Ya recibe el valor invertido de estrés (1–5, 5 = poco estrés). */
const directOk = (v: number) => clamp01((clamp(v, 1, 5) - 1) / 4);

/** Serializa el featureSet para persistencia (solo números, sin texto libre). */
export function serializeFeatures(featureSet: FeatureSet): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const f of Object.values(featureSet.features)) {
    out[f.key] = f.available ? Number((f.value ?? 0).toFixed(4)) : null;
  }
  out["checkinCount14"] = featureSet.checkinCount14;
  out["wellbeingIndex7"] =
    featureSet.wellbeingIndex7 === null ? null : Number(featureSet.wellbeingIndex7.toFixed(4));
  out["wellbeingIndexPrev7"] =
    featureSet.wellbeingIndexPrev7 === null ? null : Number(featureSet.wellbeingIndexPrev7.toFixed(4));
  return out;
}
