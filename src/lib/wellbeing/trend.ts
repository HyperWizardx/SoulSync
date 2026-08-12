import type { FeatureSet, TrendDirection } from "./types";

/** Umbral mínimo de cambio del índice para considerar que hay tendencia. */
export const TREND_THRESHOLD = 0.05;

export interface TrendResult {
  trend: TrendDirection;
  /** Índice(7d) − Índice(7d previos). Positivo = mejora esperada. */
  trendDelta: number;
}

/**
 * Tendencia esperada del bienestar para el próximo periodo (7 días).
 * Compara el índice compuesto (autorreporte + cumplimiento real de tareas)
 * de la semana actual contra la anterior. Función pura y determinista.
 *
 * NO es un pronóstico clínico: describe hacia dónde se mueven los indicadores
 * observados, no una evolución diagnóstica.
 */
export function computeTrend(featureSet: FeatureSet): TrendResult {
  const current = featureSet.wellbeingIndex7;
  const previous = featureSet.wellbeingIndexPrev7;
  if (current === null || previous === null) {
    return { trend: "indeterminada", trendDelta: 0 };
  }
  const delta = Number((current - previous).toFixed(4));
  if (delta > TREND_THRESHOLD) return { trend: "mejorando", trendDelta: delta };
  if (delta < -TREND_THRESHOLD) return { trend: "empeorando", trendDelta: delta };
  return { trend: "estable", trendDelta: delta };
}

export const TREND_COPY: Record<TrendDirection, { label: string; body: string }> = {
  mejorando: {
    label: "Tendencia al alza",
    body: "Tus check-ins y el cumplimiento de tus tareas apuntan a una semana mejor que la anterior.",
  },
  estable: {
    label: "Tendencia estable",
    body: "Tus indicadores se mantienen en un rango parecido al de la semana pasada.",
  },
  empeorando: {
    label: "Tendencia a la baja",
    body: "Tus check-ins y tus tareas completadas coinciden con un descenso respecto a la semana anterior.",
  },
  indeterminada: {
    label: "Tendencia aún no estimable",
    body: "Faltan check-ins en alguna de las dos semanas para comparar periodos.",
  },
};
