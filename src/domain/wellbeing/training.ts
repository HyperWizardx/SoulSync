/**
 * Entrenamiento de la brújula — capa de Dominio (pura y determinista).
 * 1. Etiquetas: cada pergamino WHO-5 marca "bienestar bajo" si el puntaje es < 13 (punto de
 *    corte validado de la escala). Los indicadores se calculan con los datos ANTERIORES a esa
 *    respuesta (sin usar el propio pergamino), como los vería la brújula ese día.
 * 2. Modelo: regresión logística MAP con prior gaussiano centrado en los pesos expertos; el
 *    parámetro λ dice cuánto confiar en el criterio experto frente a los datos.
 * 3. Evaluación: validación cruzada agrupada por estudiante (nadie está a la vez en
 *    entrenamiento y prueba) comparando el modelo entrenado con el experto.
 */
import { assessCoverage, baselineLogisticModel, sigmoid, THRESHOLD_MODERADO } from "@/domain/wellbeing/baselineLogistic";
import { FEATURE_LABELS } from "@/domain/wellbeing/copy";
import { extractFeatures } from "@/domain/wellbeing/features";
import { seededRandom } from "@/domain/wellbeing/recommender";
import { FEATURE_KEYS, expertPrior, type TrainedParams } from "@/domain/wellbeing/trainedLogistic";
import { FEATURE_VERSION } from "@/domain/wellbeing/types";
import type { CheckinRecord, FeatureKey, FeatureSet, ScaleRecord, TaskEventRecord } from "@/domain/wellbeing/types";
import { WHO5_CODE } from "@/domain/wellbeing/who5";

/** WHO-5 bruto menor a 13 (de 25) = bienestar bajo: la etiqueta positiva. */
export const WHO5_POOR_CUTOFF = 13;
/** Datos mínimos para poder activar una brújula entrenada. */
export const TRAINING_MIN = { samples: 40, positives: 8, negatives: 8, students: 8 } as const;
export const LAMBDA_GRID: readonly number[] = [0.3, 1, 3, 10, 30];

export interface StudentHistory {
  userId: string;
  checkins: CheckinRecord[];
  /** Fecha (YYYY-MM-DD) de cada misión completada. */
  missionDates: string[];
  dailyGoal: number;
  taskEvents: TaskEventRecord[];
  scales: ScaleRecord[];
  /** Subgrupos para la auditoría de equidad (arquetipo y variables opcionales). */
  group: Record<string, string | undefined>;
}

export interface LabeledSample {
  userId: string;
  date: string;
  features: FeatureSet;
  /** Valor de cada indicador en el orden de FEATURE_KEYS (null = sin dato). */
  raw: (number | null)[];
  y: 0 | 1;
  who5: number;
  group: Record<string, string | undefined>;
}

/** Un ejemplo por pergamino WHO-5 con datos suficientes para que la brújula opine. */
export function buildSamples(histories: readonly StudentHistory[]): LabeledSample[] {
  const samples: LabeledSample[] = [];
  for (const h of histories) {
    for (const s of h.scales.filter((x) => x.code === WHO5_CODE)) {
      const today = s.answeredAt.slice(0, 10);
      const missionsByDate: Record<string, number> = {};
      let lastMissionDate: string | null = null;
      for (const d of h.missionDates) {
        if (d > today) continue;
        missionsByDate[d] = (missionsByDate[d] ?? 0) + 1;
        if (!lastMissionDate || d > lastMissionDate) lastMissionDate = d;
      }
      const features = extractFeatures({
        today,
        checkins: h.checkins.filter((c) => c.date <= today),
        telemetry: { missionsByDate, dailyGoal: Math.max(1, h.dailyGoal), lastMissionDate },
        scales: h.scales.filter((o) => o.answeredAt.slice(0, 10) < today),
        taskEvents: h.taskEvents.filter((e) => e.date <= today),
      });
      if (assessCoverage(features).insufficientReason) continue;
      samples.push({
        userId: h.userId,
        date: today,
        features,
        raw: FEATURE_KEYS.map((k) => (features.features[k]?.available ? features.features[k].value : null)),
        y: s.raw < WHO5_POOR_CUTOFF ? 1 : 0,
        who5: s.raw,
        group: h.group,
      });
    }
  }
  return samples;
}

// ---------- Álgebra y ajuste MAP ----------

/** Resuelve A·x = b por eliminación gaussiana con pivoteo parcial. */
export function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const p = M[col][col];
    if (Math.abs(p) < 1e-12) throw new Error("Sistema singular");
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / p;
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
    x[r] = s / M[r][r];
  }
  return x;
}

const softplus = (z: number) => (z > 0 ? z + Math.log1p(Math.exp(-z)) : Math.log1p(Math.exp(z)));

/**
 * Regresión logística MAP: minimiza la log-verosimilitud negativa + ½·Σ λⱼ(θⱼ − θ⁰ⱼ)²
 * con el método de Newton (y paso amortiguado si hace falta). θ⁰ son los pesos expertos.
 */
export function fitMapLogistic(
  X: readonly number[][],
  y: readonly number[],
  prior: { bias: number; coef: readonly number[] },
  lambda: number,
  biasLambda = lambda * 0.1,
): { bias: number; coef: number[] } {
  const d = prior.coef.length;
  const theta0 = [prior.bias, ...prior.coef];
  const lam = [biasLambda, ...new Array<number>(d).fill(lambda)];
  let theta = theta0.slice();
  const objective = (t: number[]) => {
    let f = 0;
    for (let i = 0; i < X.length; i++) {
      const z = t[0] + X[i].reduce((s, v, j) => s + v * t[j + 1], 0);
      f += softplus(z) - y[i] * z;
    }
    return f + 0.5 * t.reduce((s, v, j) => s + lam[j] * (v - theta0[j]) ** 2, 0);
  };
  let current = objective(theta);
  for (let iter = 0; iter < 100; iter++) {
    const g = theta.map((v, j) => lam[j] * (v - theta0[j]));
    const H = lam.map((l, i) => lam.map((_, j) => (i === j ? l : 0)));
    for (let i = 0; i < X.length; i++) {
      const xt = [1, ...X[i]];
      const p = sigmoid(xt.reduce((s, v, j) => s + v * theta[j], 0));
      const w = p * (1 - p);
      for (let j = 0; j <= d; j++) {
        g[j] += (p - y[i]) * xt[j];
        for (let k = j; k <= d; k++) H[j][k] += w * xt[j] * xt[k];
      }
    }
    for (let j = 0; j <= d; j++) for (let k = 0; k < j; k++) H[j][k] = H[k][j];
    const step = solveLinear(H, g);
    let t = 1;
    let next = theta.map((v, j) => v - t * step[j]);
    let value = objective(next);
    while (value > current + 1e-12 && t > 1e-4) { t /= 2; next = theta.map((v, j) => v - t * step[j]); value = objective(next); }
    const moved = Math.max(...step.map((s) => Math.abs(s * t)));
    theta = next;
    current = value;
    if (moved < 1e-9) break;
  }
  return { bias: theta[0], coef: theta.slice(1) };
}

// ---------- Métricas ----------

export interface ModelMetrics {
  n: number;
  positives: number;
  /** Área bajo la curva ROC (null si falta una de las clases). */
  auc: number | null;
  brier: number;
  logLoss: number;
  /** Error de calibración esperado (5 tramos). */
  ece: number;
  /** Sensibilidad y especificidad con el umbral de señal moderada. */
  sensitivity: number | null;
  specificity: number | null;
}

export function auc(y: readonly number[], p: readonly number[]): number | null {
  const pos = y.filter((v) => v === 1).length;
  const neg = y.length - pos;
  if (pos === 0 || neg === 0) return null;
  const order = p.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(p.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1].v === order[i].v) j++;
    for (let k = i; k <= j; k++) ranks[order[k].i] = (i + j) / 2 + 1;
    i = j + 1;
  }
  const sumPos = y.reduce((s, v, i) => s + (v === 1 ? ranks[i] : 0), 0);
  return (sumPos - (pos * (pos + 1)) / 2) / (pos * neg);
}

export function evaluate(y: readonly number[], p: readonly number[], threshold = THRESHOLD_MODERADO): ModelMetrics {
  const n = y.length;
  const eps = 1e-6;
  const clip = (v: number) => Math.min(1 - eps, Math.max(eps, v));
  const positives = y.filter((v) => v === 1).length;
  const brier = n ? y.reduce((s, v, i) => s + (p[i] - v) ** 2, 0) / n : 0;
  const logLoss = n ? -y.reduce((s, v, i) => s + v * Math.log(clip(p[i])) + (1 - v) * Math.log(1 - clip(p[i])), 0) / n : 0;
  let ece = 0;
  for (let b = 0; b < 5; b++) {
    const idx = p.map((v, i) => i).filter((i) => (b === 4 ? p[i] >= 0.8 : p[i] >= b / 5 && p[i] < (b + 1) / 5));
    if (idx.length === 0) continue;
    const meanP = idx.reduce((s, i) => s + p[i], 0) / idx.length;
    const meanY = idx.reduce((s, i) => s + y[i], 0) / idx.length;
    ece += (idx.length / n) * Math.abs(meanP - meanY);
  }
  const tp = y.filter((v, i) => v === 1 && p[i] >= threshold).length;
  const tn = y.filter((v, i) => v === 0 && p[i] < threshold).length;
  const negatives = n - positives;
  const round = (v: number) => Number(v.toFixed(4));
  const a = auc(y, p);
  return {
    n,
    positives,
    auc: a === null ? null : round(a),
    brier: round(brier),
    logLoss: round(logLoss),
    ece: round(ece),
    sensitivity: positives ? round(tp / positives) : null,
    specificity: negatives ? round(tn / negatives) : null,
  };
}

// ---------- Validación cruzada y entrenamiento ----------

/** Pliegue de cada ejemplo, agrupando por estudiante (sin fugas entre entrenamiento y prueba). */
export function groupFolds(userIds: readonly string[], k: number, seed: string): number[] | null {
  const users = [...new Set(userIds)].sort();
  const folds = Math.min(k, users.length);
  if (folds < 2) return null;
  const rand = seededRandom(seed);
  for (let i = users.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [users[i], users[j]] = [users[j], users[i]]; }
  const foldOf = new Map(users.map((u, i) => [u, i % folds]));
  return userIds.map((u) => foldOf.get(u)!);
}

/** Media de cada indicador entre los ejemplos que lo tienen (0 si nadie lo tiene). */
export function featureMeans(samples: readonly LabeledSample[]): Record<FeatureKey, number> {
  const means = {} as Record<FeatureKey, number>;
  FEATURE_KEYS.forEach((k, j) => {
    const vals = samples.map((s) => s.raw[j]).filter((v): v is number => v !== null);
    means[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
  return means;
}

const toMatrix = (samples: readonly LabeledSample[], means: Record<FeatureKey, number>) =>
  samples.map((s) => s.raw.map((v, j) => (v === null ? means[FEATURE_KEYS[j]] : v)));

function fitOn(samples: readonly LabeledSample[], lambda: number) {
  const means = featureMeans(samples);
  const prior = expertPrior();
  const fit = fitMapLogistic(toMatrix(samples, means), samples.map((s) => s.y), { bias: prior.bias, coef: FEATURE_KEYS.map((k) => prior.coef[k]) }, lambda);
  const coef = {} as Record<FeatureKey, number>;
  FEATURE_KEYS.forEach((k, j) => { coef[k] = fit.coef[j]; });
  return { bias: fit.bias, coef, means };
}

export interface CompassTraining {
  n: number;
  positives: number;
  negatives: number;
  students: number;
  lambda: number | null;
  params: TrainedParams | null;
  /** Validación cruzada fuera de pliegue: experto vs entrenado. */
  cv: { expert: ModelMetrics; trained: ModelMetrics } | null;
  /** Predicciones fuera de pliegue (para la auditoría de equidad). */
  oof: { y: number[]; expert: number[]; trained: number[]; groups: Record<string, string | undefined>[] } | null;
  /** Peso de cada indicador en escala logit: experto y aprendido. */
  weights: { key: FeatureKey; label: string; expert: number; trained: number | null }[];
}

const stamp = (d: Date) => d.toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");

export function trainCompass(samples: readonly LabeledSample[], opts: { lambdas?: readonly number[]; folds?: number; seed?: string; now?: Date } = {}): CompassTraining {
  const now = opts.now ?? new Date();
  const y = samples.map((s) => s.y);
  const positives = y.filter((v) => v === 1).length;
  const students = new Set(samples.map((s) => s.userId)).size;
  const prior = expertPrior();
  const base = { n: samples.length, positives, negatives: samples.length - positives, students };
  const expertWeights = FEATURE_KEYS.map((k) => ({ key: k, label: FEATURE_LABELS[k], expert: Number(prior.coef[k].toFixed(4)) }));
  if (samples.length === 0 || positives === 0 || positives === samples.length) {
    return { ...base, lambda: null, params: null, cv: null, oof: null, weights: expertWeights.map((w) => ({ ...w, trained: null })) };
  }

  const expertP = samples.map((s) => baselineLogisticModel.predict(s.features).score ?? 0.5);
  const folds = groupFolds(samples.map((s) => s.userId), opts.folds ?? 5, opts.seed ?? "brujula");
  let lambda = (opts.lambdas ?? LAMBDA_GRID)[0];
  let cv: CompassTraining["cv"] = null;
  let oof: CompassTraining["oof"] = null;
  if (folds) {
    let best = Infinity;
    for (const l of opts.lambdas ?? LAMBDA_GRID) {
      const pred = new Array<number>(samples.length).fill(0.5);
      const k = Math.max(...folds) + 1;
      for (let f = 0; f < k; f++) {
        const train = samples.filter((_, i) => folds[i] !== f);
        if (train.length === 0) continue;
        const m = fitOn(train, l);
        samples.forEach((s, i) => {
          if (folds[i] !== f) return;
          const x = s.raw.map((v, j) => (v === null ? m.means[FEATURE_KEYS[j]] : v));
          pred[i] = sigmoid(m.bias + FEATURE_KEYS.reduce((acc, key, j) => acc + m.coef[key] * x[j], 0));
        });
      }
      const metrics = evaluate(y, pred);
      // Empate: se prefiere el λ mayor (más cercano al criterio experto).
      if (metrics.logLoss < best - 1e-9 || (Math.abs(metrics.logLoss - best) <= 1e-9 && l > lambda)) {
        best = metrics.logLoss;
        lambda = l;
        cv = { expert: evaluate(y, expertP), trained: metrics };
        oof = { y: [...y], expert: expertP, trained: pred, groups: samples.map((s) => s.group) };
      }
    }
  }

  const final = fitOn(samples, lambda);
  const round = (v: number) => Number(v.toFixed(6));
  const params: TrainedParams = {
    version: `brujula-map-${stamp(now)}`,
    featureVersion: FEATURE_VERSION,
    bias: round(final.bias),
    coef: Object.fromEntries(FEATURE_KEYS.map((k) => [k, round(final.coef[k])])) as Record<FeatureKey, number>,
    means: Object.fromEntries(FEATURE_KEYS.map((k) => [k, round(final.means[k])])) as Record<FeatureKey, number>,
    lambda,
    n: samples.length,
    positives,
    trainedAt: now.toISOString(),
  };
  return {
    ...base,
    lambda,
    params,
    cv,
    oof,
    weights: expertWeights.map((w) => ({ ...w, trained: Number(params.coef[w.key].toFixed(4)) })),
  };
}

/** ¿Se puede activar? Datos suficientes, no peor que el experto y auditoría de equidad superada. */
export function compassGate(t: Pick<CompassTraining, "n" | "positives" | "negatives" | "students" | "cv">, equityPassed: boolean): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (t.n < TRAINING_MIN.samples) reasons.push(`Se necesitan al menos ${TRAINING_MIN.samples} pergaminos WHO-5 con datos suficientes (hay ${t.n}).`);
  if (t.students < TRAINING_MIN.students) reasons.push(`Se necesitan pergaminos de al menos ${TRAINING_MIN.students} estudiantes (hay ${t.students}).`);
  if (t.positives < TRAINING_MIN.positives || t.negatives < TRAINING_MIN.negatives) {
    reasons.push(`Se necesitan al menos ${TRAINING_MIN.positives} casos de bienestar bajo y ${TRAINING_MIN.negatives} de bienestar adecuado (hay ${t.positives} y ${t.negatives}).`);
  }
  if (!t.cv) reasons.push("No se pudo validar el modelo con estudiantes distintos a los de entrenamiento.");
  else {
    if (t.cv.trained.logLoss > t.cv.expert.logLoss) reasons.push("En validación cruzada el modelo entrenado no mejora al criterio experto (log-loss).");
    if (t.cv.trained.auc !== null && t.cv.expert.auc !== null && t.cv.trained.auc < t.cv.expert.auc - 0.02) {
      reasons.push("En validación cruzada el modelo entrenado discrimina peor que el criterio experto (AUC).");
    }
  }
  if (!equityPassed) reasons.push("La auditoría de equidad no se superó o no tiene datos suficientes por subgrupo.");
  return { ready: reasons.length === 0, reasons };
}
