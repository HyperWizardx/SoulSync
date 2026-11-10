/**
 * Auditoría de equidad — capa de Dominio (pura).
 * Compara, por subgrupo (arquetipo y variables opcionales: género, edad, semestre), la
 * calibración del modelo (probabilidad media vs. prevalencia real) y la tasa de casos de
 * bienestar bajo que no detecta (falsos negativos). Sigue el principio OMS de inclusión y
 * equidad: el modelo aprendido solo se activa si no trata peor a ningún grupo evaluable.
 */
export const EQUITY_LIMITS = {
  /** Ejemplos mínimos para evaluar un subgrupo. */
  minGroupSize: 10,
  /** Casos positivos mínimos para comparar falsos negativos. */
  minPositives: 3,
  /** Diferencia máxima tolerada en la tasa de falsos negativos entre subgrupos. */
  maxFnrGap: 0.2,
  /** Distancia máxima entre probabilidad media y prevalencia real en un subgrupo. */
  maxCalibrationGap: 0.15,
} as const;

/** Valor que no se analiza (la persona prefirió no decirlo). */
export const UNDISCLOSED = "no_dice";

export interface EquityAttribute { key: string; label: string; values: Record<string, string> }

export interface EquityGroup {
  value: string;
  label: string;
  n: number;
  positives: number;
  prevalence: number;
  meanPred: number;
  calibrationGap: number;
  /** Proporción de casos de bienestar bajo que el modelo no señala (null si hay pocos casos). */
  fnr: number | null;
}

export interface EquityAttributeResult {
  key: string;
  label: string;
  groups: EquityGroup[];
  /** Hay al menos dos subgrupos con datos suficientes. */
  evaluable: boolean;
  fnrGap: number | null;
  maxCalibrationGap: number | null;
  passed: boolean;
}

export interface EquityReport { attributes: EquityAttributeResult[]; passed: boolean; evaluable: boolean }

const round = (v: number) => Number(v.toFixed(4));

export function auditEquity(
  rows: readonly { group: Record<string, string | undefined>; y: number; p: number }[],
  attributes: readonly EquityAttribute[],
  threshold: number,
): EquityReport {
  const results = attributes.map((attr): EquityAttributeResult => {
    const byValue = new Map<string, { y: number; p: number }[]>();
    for (const r of rows) {
      const v = r.group[attr.key];
      if (!v || v === UNDISCLOSED) continue;
      byValue.set(v, [...(byValue.get(v) ?? []), { y: r.y, p: r.p }]);
    }
    const groups: EquityGroup[] = [...byValue.entries()]
      .map(([value, list]) => {
        const n = list.length;
        const positives = list.filter((x) => x.y === 1).length;
        const prevalence = positives / n;
        const meanPred = list.reduce((s, x) => s + x.p, 0) / n;
        const missed = list.filter((x) => x.y === 1 && x.p < threshold).length;
        return {
          value,
          label: attr.values[value] ?? value,
          n,
          positives,
          prevalence: round(prevalence),
          meanPred: round(meanPred),
          calibrationGap: round(Math.abs(meanPred - prevalence)),
          fnr: positives >= EQUITY_LIMITS.minPositives ? round(missed / positives) : null,
        };
      })
      .sort((a, b) => b.n - a.n);
    const sized = groups.filter((g) => g.n >= EQUITY_LIMITS.minGroupSize);
    const evaluable = sized.length >= 2;
    const fnrs = sized.map((g) => g.fnr).filter((v): v is number => v !== null);
    const fnrGap = fnrs.length >= 2 ? round(Math.max(...fnrs) - Math.min(...fnrs)) : null;
    const maxCalibrationGap = sized.length ? Math.max(...sized.map((g) => g.calibrationGap)) : null;
    const passed = !evaluable
      || ((fnrGap === null || fnrGap <= EQUITY_LIMITS.maxFnrGap) && (maxCalibrationGap === null || maxCalibrationGap <= EQUITY_LIMITS.maxCalibrationGap));
    return { key: attr.key, label: attr.label, groups, evaluable, fnrGap, maxCalibrationGap, passed };
  });
  const evaluable = results.some((r) => r.evaluable);
  // Sin ningún subgrupo comparable no se puede certificar la equidad: no se aprueba.
  return { attributes: results, evaluable, passed: evaluable && results.every((r) => r.passed) };
}
