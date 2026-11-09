import type { FeatureSet, TrendDirection } from "@/domain/wellbeing/types";

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
    label: "Tu semana va en ascenso",
    body: "Tus check-ins y tus misiones muestran una semana mejor que la anterior. ¡Sigue así!",
  },
  estable: {
    label: "Paso firme",
    body: "Vas a un ritmo parecido al de la semana pasada. La constancia también es una victoria.",
  },
  empeorando: {
    label: "Terreno difícil",
    body: "Esta semana el camino se puso más cuesta arriba que la anterior. Una misión corta puede ayudarte a recuperar el aliento.",
  },
  indeterminada: {
    label: "Rumbo por descubrir",
    body: "Aún faltan check-ins para comparar tus semanas. ¡Registra tu día y lo verás!",
  },
};
