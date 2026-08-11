import type { FactorExplanation, FeatureKey, FeatureSet } from "./types";
import { FEATURE_DESCRIPTIONS, FEATURE_LABELS } from "./copy";

/**
 * Construye la explicación del score: contribución relativa de cada feature
 * disponible respecto al peso total disponible.
 */
export function explainContributions(
  featureSet: FeatureSet,
  weights: Record<FeatureKey, number>,
): FactorExplanation[] {
  const entries = Object.values(featureSet.features).filter((f) => f.available);
  const totalWeight = entries.reduce((s, f) => s + (weights[f.key] ?? 0), 0);
  if (totalWeight === 0) return [];

  return entries
    .map((f) => {
      const value = f.value ?? 0;
      const w = weights[f.key] ?? 0;
      return {
        key: f.key,
        label: FEATURE_LABELS[f.key],
        contribution: Number(((w * value) / totalWeight).toFixed(4)),
        value: Number(value.toFixed(4)),
        direction: (value >= 0.5 ? "riesgo" : "protector") as FactorExplanation["direction"],
        description: FEATURE_DESCRIPTIONS[f.key],
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}
