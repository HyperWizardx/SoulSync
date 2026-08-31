import type { CheckinRecord } from "./types";
import { MISSION_CATEGORY, getMissionById } from "@/lib/missionsData";
import type { TaskCategoryName } from "@/hooks/useUserStore";

export type MetricKey = "bienestar" | "resiliencia" | "energia" | "claridad";

export interface MetricResult {
  key: MetricKey;
  /** 0–100, o null cuando no hay datos reales suficientes */
  value: number | null;
  /** 0–1: proporción de señales disponibles que alimentan la métrica */
  coverage: number;
  /** Texto corto y trazable con el origen del número */
  source: string;
}

export interface MetricsInput {
  missionHistory: { id: string; title: string; date: string; xp: number }[];
  checkins: CheckinRecord[];
  streak: number;
  dailyGoal: number;
  /** Fecha de referencia (por defecto hoy) */
  today?: Date;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const pct = (n: number) => Math.round(clamp01(n) * 100);
const norm5 = (n: number) => clamp01((n - 1) / 4);

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / 86_400_000);
}

function parseDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function categoryOf(missionId: string): TaskCategoryName | null {
  const mission = getMissionById(missionId);
  return mission ? MISSION_CATEGORY[mission.type] : null;
}

interface Part {
  /** null cuando la señal no está disponible */
  value: number | null;
  weight: number;
}

function combine(parts: Part[]): { value: number | null; coverage: number } {
  const totalWeight = parts.reduce((acc, p) => acc + p.weight, 0);
  const available = parts.filter((p): p is Part & { value: number } => p.value !== null);
  const availableWeight = available.reduce((acc, p) => acc + p.weight, 0);
  if (availableWeight === 0) return { value: null, coverage: 0 };
  const value = available.reduce((acc, p) => acc + p.value * p.weight, 0) / availableWeight;
  return { value: pct(value), coverage: clamp01(totalWeight === 0 ? 1 : availableWeight / totalWeight) };
}

/**
 * Deriva las cuatro métricas del dashboard exclusivamente de la actividad real
 * del usuario: misiones completadas, racha y check-ins recientes. Función pura.
 */
export function deriveUserMetrics(input: MetricsInput): Record<MetricKey, MetricResult> {
  const today = input.today ?? new Date();
  const goal = Math.max(1, input.dailyGoal || 1);

  const missions7 = input.missionHistory.filter((m) => {
    const d = parseDate(m.date);
    return d !== null && daysBetween(today, d) <= 6;
  });

  const countCat = (cats: TaskCategoryName[]) =>
    missions7.filter((m) => {
      const c = categoryOf(m.id);
      return c !== null && cats.includes(c);
    }).length;

  const checkins7 = input.checkins.filter((c) => {
    const d = parseDate(c.date);
    return d !== null && daysBetween(today, d) <= 6;
  });

  const avg = (pick: (c: CheckinRecord) => number): number | null =>
    checkins7.length === 0 ? null : checkins7.reduce((acc, c) => acc + pick(c), 0) / checkins7.length;

  const mood = avg((c) => c.mood);
  const stress = avg((c) => c.stress);
  const energy = avg((c) => c.energy);
  const social = avg((c) => c.social);

  const adherence7 = missions7.length === 0 ? null : clamp01(missions7.length / (goal * 7));
  const hasMissions = missions7.length > 0;
  const hasCheckins = checkins7.length > 0;

  const missionsLabel = `${missions7.length} ${missions7.length === 1 ? "misión" : "misiones"} esta semana`;
  const checkinLabel = `${checkins7.length} check-in${checkins7.length === 1 ? "" : "s"} esta semana`;
  const both = `${missionsLabel} · ${checkinLabel}`;

  const build = (key: MetricKey, parts: Part[], source: string): MetricResult => {
    const { value, coverage } = combine(parts);
    return { key, value, coverage, source: value === null ? "Sin datos aún" : source };
  };

  const movimiento = countCat(["movimiento", "ar"]);
  const reflexivas = countCat(["reflexion", "cognitivo"]);
  const autocuidado = countCat(["autocuidado"]);

  return {
    bienestar: build(
      "bienestar",
      [
        { value: mood === null ? null : norm5(mood), weight: 0.5 },
        { value: stress === null ? null : 1 - norm5(stress), weight: 0.2 },
        { value: adherence7 === null ? null : adherence7, weight: 0.2 },
        { value: hasMissions ? clamp01(autocuidado / 3) : null, weight: 0.1 },
      ],
      hasCheckins && hasMissions ? both : hasCheckins ? checkinLabel : missionsLabel,
    ),
    resiliencia: build(
      "resiliencia",
      [
        { value: input.streak > 0 ? clamp01(input.streak / 7) : null, weight: 0.45 },
        { value: adherence7 === null ? null : adherence7, weight: 0.35 },
        { value: social === null ? null : norm5(social), weight: 0.2 },
      ],
      input.streak > 0 ? `Racha de ${input.streak} día${input.streak === 1 ? "" : "s"} · ${missionsLabel}` : missionsLabel,
    ),
    energia: build(
      "energia",
      [
        { value: energy === null ? null : norm5(energy), weight: 0.55 },
        { value: hasMissions ? clamp01(movimiento / 3) : null, weight: 0.3 },
        { value: adherence7 === null ? null : adherence7, weight: 0.15 },
      ],
      hasCheckins && hasMissions
        ? `${checkinLabel} · ${movimiento} de movimiento`
        : hasCheckins
          ? checkinLabel
          : `${movimiento} ${movimiento === 1 ? "misión" : "misiones"} de movimiento`,
    ),
    claridad: build(
      "claridad",
      [
        { value: hasMissions ? clamp01(reflexivas / 3) : null, weight: 0.45 },
        { value: stress === null ? null : 1 - norm5(stress), weight: 0.35 },
        { value: mood === null ? null : norm5(mood), weight: 0.2 },
      ],
      hasMissions
        ? `${reflexivas} ${reflexivas === 1 ? "misión" : "misiones"} de reflexión · ${checkinLabel}`
        : checkinLabel,
    ),
  };
}
