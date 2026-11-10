/**
 * Recomendador de misiones que aprende (IA propia) — capa de Dominio (pura).
 * Bandido bayesiano Beta-Bernoulli con muestreo de Thompson, uno por estudiante y por categoría
 * de misión. Recompensa = el check-in siguiente a la misión mejora (o se mantiene alto).
 * Prior: las categorías afines al arquetipo empiezan con un éxito a favor.
 * El azar se siembra con estudiante + día: las recomendaciones no cambian en cada recarga.
 */
import type { TaskCategoryName } from "@/domain/gamification/rewards";

export const RECOMMENDER_VERSION = "thompson-v1";
export const ARMS: readonly TaskCategoryName[] = ["autocuidado", "reflexion", "movimiento", "social", "cognitivo", "ar"];
/** Días hacia adelante en los que se busca el check-in que mide el efecto de una misión. */
export const OUTCOME_WINDOW_DAYS = 2;

export interface MissionDone { date: string; category: TaskCategoryName }
export interface CheckinPoint { date: string; mood: number; stress: number }
export interface Outcome { date: string; category: TaskCategoryName; success: boolean }

const DAY = 86_400_000;
const dayDiff = (a: string, b: string) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY;
const composite = (c: CheckinPoint) => c.mood - c.stress; // −4 (peor) a 4 (mejor)

/**
 * Efecto de cada categoría de misión hecha en un día: compara el último check-in hasta ese día
 * con el primero de los dos días siguientes. Una misma categoría cuenta una vez por día.
 */
export function missionOutcomes(missions: readonly MissionDone[], checkins: readonly CheckinPoint[]): Outcome[] {
  const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  const seen = new Set<string>();
  const out: Outcome[] = [];
  for (const m of missions) {
    const key = `${m.date}|${m.category}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const before = [...sorted].reverse().find((c) => c.date <= m.date);
    const after = sorted.find((c) => c.date > m.date && dayDiff(m.date, c.date) <= OUTCOME_WINDOW_DAYS);
    if (!before || !after) continue;
    const success = composite(after) > composite(before) || (after.mood >= 4 && after.stress <= 2);
    out.push({ date: m.date, category: m.category, success });
  }
  return out;
}

export interface ArmStats { category: TaskCategoryName; alpha: number; beta: number; successes: number; trials: number }

/** Parámetros Beta por categoría: prior (afinidad del arquetipo) + éxitos y fracasos observados. */
export function armStats(outcomes: readonly Outcome[], affinity: readonly TaskCategoryName[] = []): ArmStats[] {
  return ARMS.map((category) => {
    const mine = outcomes.filter((o) => o.category === category);
    const successes = mine.filter((o) => o.success).length;
    const prior = affinity.includes(category) ? 2 : 1;
    return { category, alpha: prior + successes, beta: 1 + (mine.length - successes), successes, trials: mine.length };
  });
}

/** Generador pseudoaleatorio reproducible (mulberry32). */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rand: () => number): number {
  const u = Math.max(rand(), 1e-12), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Muestra Gamma(k, 1) por Marsaglia-Tsang (k ≥ 1; para k < 1 se usa el truco de potencia). */
function gamma(k: number, rand: () => number): number {
  if (k < 1) return gamma(k + 1, rand) * Math.pow(Math.max(rand(), 1e-12), 1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do { x = normal(rand); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(Math.max(u, 1e-12)) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Muestra de una Beta(α, β). */
export function sampleBeta(alpha: number, beta: number, rand: () => number): number {
  const x = gamma(alpha, rand), y = gamma(beta, rand);
  return x / (x + y);
}

export interface RecommendedMission {
  missionId: string;
  category: TaskCategoryName;
  score: number;   // muestra de Thompson de su categoría
  reason: string;
}

export interface Candidate { id: string; category: TaskCategoryName }

const CATEGORY_IN_SENTENCE: Record<TaskCategoryName, string> = {
  autocuidado: "autocuidado", reflexion: "reflexión", movimiento: "movimiento", social: "conexión social", cognitivo: "mente", ar: "realidad aumentada",
};

/** Por qué se recomienda: lo aprendido si hay datos, si no la afinidad o la exploración. */
export function recommendationReason(stat: ArmStats, affine: boolean, archetypeName: string): string {
  if (stat.trials >= 2) {
    return `Después de misiones de ${CATEGORY_IN_SENTENCE[stat.category]} tu ánimo mejoró ${stat.successes} de ${stat.trials} veces.`;
  }
  if (affine) return `Afín a tu ${archetypeName}: la probamos primero.`;
  return "Probando algo nuevo para conocerte mejor.";
}

/**
 * Muestreo de Thompson: una muestra Beta por categoría, se ordenan de mayor a menor y se toma
 * una misión disponible de cada categoría hasta completar `n` (sin repetir categoría).
 */
export function recommend(params: {
  stats: readonly ArmStats[];
  candidates: readonly Candidate[];
  rand: () => number;
  affinity?: readonly TaskCategoryName[];
  archetypeName?: string;
  n?: number;
}): RecommendedMission[] {
  const { stats, candidates, rand, affinity = [], archetypeName = "héroe", n = 3 } = params;
  const ranked = stats
    .map((s) => ({ s, score: sampleBeta(s.alpha, s.beta, rand) }))
    .sort((a, b) => b.score - a.score);
  const out: RecommendedMission[] = [];
  for (const { s, score } of ranked) {
    const pool = candidates.filter((c) => c.category === s.category);
    if (pool.length === 0) continue;
    const pick = pool.at(Math.floor(rand() * pool.length)) ?? pool[0];
    out.push({ missionId: pick.id, category: s.category, score: Math.round(score * 1000) / 1000, reason: recommendationReason(s, affinity.includes(s.category), archetypeName) });
    if (out.length >= n) break;
  }
  return out;
}

/** Resumen para el panel del equipo: cuántas recomendaciones se mostraron y se aceptaron. */
export function summarizeRecommendations(rows: readonly { category: string; taken: boolean }[]) {
  const byCategory = new Map<string, { shown: number; taken: number }>();
  for (const r of rows) {
    const c = byCategory.get(r.category) ?? { shown: 0, taken: 0 };
    c.shown += 1;
    if (r.taken) c.taken += 1;
    byCategory.set(r.category, c);
  }
  const shown = rows.length, taken = rows.filter((r) => r.taken).length;
  return {
    shown,
    taken,
    acceptance: shown ? Math.round((taken / shown) * 100) : 0,
    byCategory: [...byCategory.entries()].map(([category, v]) => ({ category, ...v, acceptance: v.shown ? Math.round((v.taken / v.shown) * 100) : 0 }))
      .sort((a, b) => b.shown - a.shown),
  };
}
