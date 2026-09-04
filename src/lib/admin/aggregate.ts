import type { RiskLevel, TrendDirection } from "@/lib/wellbeing/types";

/**
 * Código de participante estable y seudónimo derivado del id de usuario.
 * Determinista: el mismo usuario siempre obtiene el mismo código, y el código
 * no permite reconstruir el id original de forma trivial.
 */
export function participantCode(userId: string): string {
  const hex = userId.replace(/[^a-f0-9]/gi, "").toUpperCase();
  return `P-${hex.slice(0, 6) || "000000"}`;
}

export interface StudentRow {
  userId: string;
  participantCode: string;
  name: string;
  email: string | null;
  level: number;
  streak: number;
  archetype: number | null;
  consent: "vigente" | "revocado" | "ninguno" | "desactualizado";
  riskLevel: RiskLevel | null;
  score: number | null;
  trend: TrendDirection | null;
  coverage: number;
  checkins14: number;
  missions7: number;
  skipped7: number;
  adherence7: number | null;
  lastCheckin: string | null;
  lastActivity: string | null;
}

export interface PopulationMetrics {
  total: number;
  withConsent: number;
  withSignal: number;
  riskDistribution: Record<RiskLevel, number>;
  trendDistribution: Record<TrendDirection, number>;
  avgAdherence7: number | null;
  avgCheckins14: number | null;
  avgCoverage: number | null;
  skipRate: number | null;
  activeToday: number;
}

const RISK_KEYS: RiskLevel[] = ["bajo", "moderado", "alto", "insuficiente"];
const TREND_KEYS: TrendDirection[] = ["mejorando", "estable", "empeorando", "indeterminada"];

const mean = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

/** Agrega la población a partir de las filas ya calculadas. Función pura. */
export function aggregatePopulation(rows: StudentRow[], today: string): PopulationMetrics {
  const riskDistribution = Object.fromEntries(RISK_KEYS.map((k) => [k, 0])) as Record<RiskLevel, number>;
  const trendDistribution = Object.fromEntries(TREND_KEYS.map((k) => [k, 0])) as Record<
    TrendDirection,
    number
  >;

  let withConsent = 0;
  let withSignal = 0;
  let activeToday = 0;
  let completed = 0;
  let skipped = 0;
  const adherences: number[] = [];
  const checkinCounts: number[] = [];
  const coverages: number[] = [];

  for (const row of rows) {
    if (row.consent === "vigente") withConsent += 1;
    if (row.riskLevel) {
      riskDistribution[row.riskLevel] += 1;
      if (row.riskLevel !== "insuficiente") withSignal += 1;
    }
    if (row.trend) trendDistribution[row.trend] += 1;
    if (row.lastActivity?.slice(0, 10) === today) activeToday += 1;
    if (row.adherence7 !== null) adherences.push(row.adherence7);
    if (row.consent === "vigente") {
      checkinCounts.push(row.checkins14);
      coverages.push(row.coverage);
    }
    completed += row.missions7;
    skipped += row.skipped7;
  }

  return {
    total: rows.length,
    withConsent,
    withSignal,
    riskDistribution,
    trendDistribution,
    avgAdherence7: mean(adherences),
    avgCheckins14: mean(checkinCounts),
    avgCoverage: mean(coverages),
    skipRate: completed + skipped === 0 ? null : skipped / (completed + skipped),
    activeToday,
  };
}

/** Serializa filas a CSV con comillas seguras. Función pura. */
export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}
