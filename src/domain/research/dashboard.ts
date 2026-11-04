/** Series agregadas para los paneles de psicología e investigación. Funciones puras, sin identidad. */
import type { StudentRow } from "./aggregate";

export interface DailyPoint { date: string; checkins: number; mood: number | null; stress: number | null; sleep: number | null; missions: number; }
export interface RiskHistoryPoint { date: string; bajo: number; moderado: number; alto: number; }
export interface DashboardSeries {
  daily: DailyPoint[];
  riskHistory: RiskHistoryPoint[];
  topFactors: { label: string; count: number }[];
  confidence: { alta: number; media: number; baja: number };
  categories: { category: string; completed: number; skipped: number }[];
  missionMood: { withMissions: number | null; withoutMissions: number | null };
  noCheckin3d: number;
  safetyFlagged: number;
}
export interface DashboardInput {
  today: string;
  days?: number;
  rows: StudentRow[];
  checkins: { user_id: string; checkin_date: string; mood: number; stress: number; sleep_hours: number | null }[];
  missions: { user_id: string; completed_date: string }[];
  tasks: { status: string; category: string }[];
  predictions: { risk_level: string; generated_at: string }[];
}

const avg = (v: number[]) => (v.length ? Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(2)) : null);
const shift = (today: string, n: number) => new Date(Date.parse(`${today}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

export function buildDashboardSeries(input: DashboardInput): DashboardSeries {
  const days = input.days ?? 14;
  const dates = Array.from({ length: days }, (_, i) => shift(input.today, days - 1 - i));
  const consented = new Set(input.rows.filter((r) => r.consent === "vigente").map((r) => r.userId));
  const checkins = input.checkins.filter((c) => consented.has(c.user_id));

  const daily = dates.map((date) => {
    const day = checkins.filter((c) => c.checkin_date === date);
    return {
      date,
      checkins: day.length,
      mood: avg(day.map((c) => c.mood)),
      stress: avg(day.map((c) => c.stress)),
      sleep: avg(day.map((c) => c.sleep_hours).filter((h): h is number => h !== null).map(Number)),
      missions: input.missions.filter((m) => m.completed_date === date).length,
    };
  });

  const riskHistory = dates.map((date) => {
    const p = input.predictions.filter((x) => x.generated_at.slice(0, 10) === date);
    return { date, bajo: p.filter((x) => x.risk_level === "bajo").length, moderado: p.filter((x) => x.risk_level === "moderado").length, alto: p.filter((x) => x.risk_level === "alto").length };
  });

  const factorCount = new Map<string, number>();
  for (const r of input.rows) for (const f of r.topFactors ?? []) factorCount.set(f, (factorCount.get(f) ?? 0) + 1);
  const topFactors = [...factorCount.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  const confidence = { alta: 0, media: 0, baja: 0 };
  for (const r of input.rows) if (r.confidence) confidence[r.confidence] += 1;

  const cat = new Map<string, { completed: number; skipped: number }>();
  for (const t of input.tasks) {
    const e = cat.get(t.category) ?? { completed: 0, skipped: 0 };
    if (t.status === "completed") e.completed += 1;
    if (t.status === "skipped") e.skipped += 1;
    cat.set(t.category, e);
  }

  // Ánimo de los días con y sin misiones completadas (misma persona y día).
  const missionDays = new Set(input.missions.map((m) => `${m.user_id}|${m.completed_date}`));
  const withM: number[] = [], withoutM: number[] = [];
  for (const c of checkins) (missionDays.has(`${c.user_id}|${c.checkin_date}`) ? withM : withoutM).push(c.mood);

  const limit = shift(input.today, 3);
  const noCheckin3d = input.rows.filter((r) => r.consent === "vigente" && (!r.lastCheckin || r.lastCheckin < limit)).length;

  return {
    daily, riskHistory, topFactors, confidence,
    categories: [...cat.entries()].map(([category, v]) => ({ category, ...v })),
    missionMood: { withMissions: avg(withM), withoutMissions: avg(withoutM) },
    noCheckin3d,
    safetyFlagged: input.rows.filter((r) => (r.safetyFlags ?? 0) > 0).length,
  };
}
