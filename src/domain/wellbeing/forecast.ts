/**
 * Pronóstico de ánimo — capa de Dominio (pura).
 * Suavizado exponencial de Holt con tendencia amortiguada, ajustado POR ESTUDIANTE: los
 * parámetros α (nivel) y β (tendencia) se eligen minimizando el error de pronóstico a un paso
 * sobre su propia serie de check-ins. Anticipa una posible bajada para sugerir autocuidado antes
 * de que llegue. Es una estimación orientativa, nunca un diagnóstico.
 */
import type { CheckinRecord } from "@/domain/wellbeing/types";

export const FORECAST_MIN_POINTS = 7;
export const FORECAST_WINDOW_DAYS = 21;
export const FORECAST_HORIZON = 3;
/** Amortiguación de la tendencia (Gardner): evita extrapolar subidas o bajadas sin límite. */
export const DAMPING = 0.9;
const ALPHAS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
// β = 0 deja solo el nivel (suavizado simple) cuando la tendencia no ayuda.
const BETAS = [0, 0.05, 0.1, 0.2, 0.3];

export type ForecastSky = "despejado" | "nubes" | "tormenta";

export interface MoodForecast {
  /** Ánimo esperado (1–5) en los próximos registros. */
  forecast: number[];
  lower: number[];
  upper: number[];
  alpha: number;
  beta: number;
  /** Error típico a un paso en su propia serie. */
  rmse: number;
  recentMean: number;
  /** Cambio diario estimado del ánimo. */
  trendPerStep: number;
  dip: boolean;
  sky: ForecastSky;
  points: number;
}

const clampMood = (v: number) => Math.max(1, Math.min(5, v));
const round2 = (v: number) => Number(v.toFixed(2));
const dampSum = (h: number) => { let s = 0; for (let i = 1; i <= h; i++) s += DAMPING ** i; return s; };

/** Recorre la serie con Holt amortiguado y devuelve el estado final y los errores a un paso. */
export function holt(series: readonly number[], alpha: number, beta: number): { level: number; trend: number; errors: number[] } {
  let level = series[0];
  // Tendencia inicial: pendiente media de los primeros registros (más estable que un solo salto).
  const k = Math.min(3, series.length - 1);
  let trend = k > 0 ? (series[k] - series[0]) / k : 0;
  const errors: number[] = [];
  for (let t = 1; t < series.length; t++) {
    const predicted = level + DAMPING * trend;
    errors.push(series[t] - predicted);
    const prevLevel = level;
    level = alpha * series[t] + (1 - alpha) * predicted;
    trend = beta * (level - prevLevel) + (1 - beta) * DAMPING * trend;
  }
  return { level, trend, errors };
}

/** Elige α y β con menor error cuadrático a un paso (se ignora el arranque). */
export function fitHolt(series: readonly number[]): { alpha: number; beta: number; sse: number } {
  let best = { alpha: 0.5, beta: 0.1, sse: Infinity };
  for (const alpha of ALPHAS) {
    for (const beta of BETAS) {
      const { errors } = holt(series, alpha, beta);
      const sse = errors.slice(1).reduce((s, e) => s + e * e, 0);
      if (sse < best.sse - 1e-12) best = { alpha, beta, sse };
    }
  }
  return best;
}

/** Pronóstico h pasos adelante a partir de una serie (sin restricción de fechas). */
export function forecastSeries(series: readonly number[], horizon = FORECAST_HORIZON) {
  const { alpha, beta } = fitHolt(series);
  const { level, trend, errors } = holt(series, alpha, beta);
  const used = errors.slice(1);
  const rmse = used.length ? Math.sqrt(used.reduce((s, e) => s + e * e, 0) / used.length) : 0.75;
  const forecast = Array.from({ length: horizon }, (_, i) => clampMood(level + dampSum(i + 1) * trend));
  return { alpha, beta, rmse, forecast, trend };
}

/**
 * Pronóstico de los próximos registros con los check-ins de las últimas 3 semanas.
 * Señala bajada si el ánimo esperado llega a la zona baja (≤ 2.5) o cae ≥ 0.75 puntos frente
 * a la última semana con tendencia descendente.
 */
export function forecastMood(checkins: readonly CheckinRecord[], today: string): MoodForecast | null {
  const start = new Date(Date.parse(`${today}T00:00:00Z`) - (FORECAST_WINDOW_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);
  const recent = checkins.filter((c) => c.date >= start && c.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  if (recent.length < FORECAST_MIN_POINTS) return null;
  const series = recent.map((c) => c.mood);
  const { alpha, beta, rmse, forecast, trend } = forecastSeries(series);
  const last7 = series.slice(-7);
  const recentMean = last7.reduce((a, b) => a + b, 0) / last7.length;
  const end = forecast[forecast.length - 1];
  const dip = end <= 2.5 || (trend < 0 && recentMean - end >= 0.75);
  const sky: ForecastSky = dip ? (end <= 2 ? "tormenta" : "nubes") : "despejado";
  return {
    forecast: forecast.map(round2),
    lower: forecast.map((f, i) => round2(clampMood(f - 1.28 * rmse * Math.sqrt(i + 1)))),
    upper: forecast.map((f, i) => round2(clampMood(f + 1.28 * rmse * Math.sqrt(i + 1)))),
    alpha,
    beta,
    rmse: round2(rmse),
    recentMean: round2(recentMean),
    trendPerStep: round2(trend),
    dip,
    sky,
    points: series.length,
  };
}

/** Mensajes para el estudiante, con el tono de la aventura. */
export const SKY_COPY: Record<ForecastSky, { title: string; body: string }> = {
  despejado: { title: "Cielo despejado", body: "Tu ánimo se ve estable para los próximos días. Sigue cuidando lo que te hace bien." },
  nubes: { title: "Nubes en el horizonte", body: "Tu ánimo podría bajar un poco en los próximos días. Prepárate con una misión de autocuidado antes de que llegue." },
  tormenta: { title: "Se acerca una tormenta", body: "Tu ánimo podría estar bajo en los próximos días. No tienes que enfrentarla en soledad: cuídate y busca apoyo si lo necesitas." },
};

export interface ForecastErrors { mae: number | null; rmse: number | null }
export type ForecastMethod = "holt" | "naive" | "mean7";

export interface ForecastBacktest {
  students: number;
  /** Pronósticos evaluados a 1 paso. */
  predictions: number;
  /** Errores a 1 y a 3 registros (el horizonte del aviso) de Holt y de dos referencias simples:
   *  repetir el último valor y la media de los últimos 7. */
  h1: Record<ForecastMethod, ForecastErrors>;
  h3: Record<ForecastMethod, ForecastErrors>;
}

/**
 * Evaluación con origen móvil: cada registro se pronostica solo con los anteriores (mín. 7).
 * Se informan MAE y RMSE porque con ánimos enteros (1–5) repetir el último valor es una
 * referencia exigente en MAE, mientras Holt minimiza el error cuadrático.
 */
export function backtestForecast(seriesList: readonly (readonly number[])[]): ForecastBacktest {
  let students = 0;
  const errs = (h: 1 | 3) => ({ holt: [] as number[], naive: [] as number[], mean7: [] as number[], h });
  const sets = [errs(1), errs(3)];
  for (const series of seriesList) {
    if (series.length < FORECAST_MIN_POINTS + 1) continue;
    students++;
    for (let t = FORECAST_MIN_POINTS; t < series.length; t++) {
      const history = series.slice(0, t);
      const forecast = forecastSeries(history, FORECAST_HORIZON).forecast;
      const last7 = history.slice(-7);
      const mean7 = last7.reduce((a, b) => a + b, 0) / last7.length;
      for (const set of sets) {
        const actual = series[t + set.h - 1];
        if (actual === undefined) continue;
        set.holt.push(actual - forecast[set.h - 1]);
        set.naive.push(actual - history[history.length - 1]);
        set.mean7.push(actual - mean7);
      }
    }
  }
  const summary = (v: number[]): ForecastErrors => v.length
    ? { mae: Number((v.reduce((a, b) => a + Math.abs(b), 0) / v.length).toFixed(3)), rmse: Number(Math.sqrt(v.reduce((a, b) => a + b * b, 0) / v.length).toFixed(3)) }
    : { mae: null, rmse: null };
  const pack = (s: (typeof sets)[number]) => ({ holt: summary(s.holt), naive: summary(s.naive), mean7: summary(s.mean7) });
  return { students, predictions: sets[0].holt.length, h1: pack(sets[0]), h3: pack(sets[1]) };
}
