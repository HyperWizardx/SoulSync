import { decisionModel } from "@/domain/wellbeing/decision";
import { extractFeatures } from "@/domain/wellbeing/features";
import type { DecisionContext, PredictionInput, WellbeingModel, WellbeingPrediction } from "@/domain/wellbeing/types";

/**
 * Punto único de inferencia. El modelo activo es el criterio de decisión v4,
 * que envuelve al baseline logístico. Para un modelo entrenado basta con
 * implementar `WellbeingModel`, sin tocar la UI ni la persistencia.
 */
export const activeModel: WellbeingModel = decisionModel;

/** ¿La fecha cae en algún periodo académico intenso? */
export function isExamPeriod(today: string, periods: { start: string; end: string }[]): boolean {
  return periods.some((p) => p.start <= today && today <= p.end);
}

export function runInference(
  input: PredictionInput,
  context: Omit<DecisionContext, "checkins" | "today"> = {},
  model: WellbeingModel = activeModel,
): WellbeingPrediction {
  return model.predict(extractFeatures(input), { ...context, checkins: input.checkins, today: input.today });
}
