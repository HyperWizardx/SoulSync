import { baselineLogisticModel } from "@/domain/wellbeing/baselineLogistic";
import { extractFeatures } from "@/domain/wellbeing/features";
import type { PredictionInput, WellbeingModel, WellbeingPrediction } from "@/domain/wellbeing/types";

/**
 * Punto único de inferencia. Para pasar a un modelo entrenado con datos reales
 * basta con implementar `WellbeingModel` y pasarlo como segundo argumento
 * (o cambiar `activeModel`), sin tocar la UI ni la persistencia.
 */
export const activeModel: WellbeingModel = baselineLogisticModel;

export function runInference(input: PredictionInput, model: WellbeingModel = activeModel): WellbeingPrediction {
  return model.predict(extractFeatures(input));
}
