/**
 * Laboratorio de modelos (fase 4) — capa de Aplicación.
 * Entrena la brújula con etiquetas WHO-5, la compara con el criterio experto, audita su equidad
 * por subgrupo y la registra inactiva; el equipo de investigación la activa solo si supera la
 * compuerta. También evalúa el pronóstico de ánimo y calcula los perfiles del grupo.
 */
import { THRESHOLD_MODERADO } from '@/domain/wellbeing/baselineLogistic';
import { backtestForecast, type ForecastBacktest } from '@/domain/wellbeing/forecast';
import { buildSamples, compassGate, trainCompass, type CompassTraining, type ModelMetrics, type StudentHistory } from '@/domain/wellbeing/training';
import type { TaskCategory, TaskStatus } from '@/domain/wellbeing/types';
import { isUsableParams, type TrainedParams } from '@/domain/wellbeing/trainedLogistic';
import { auditEquity, type EquityReport } from '@/domain/research/equity';
import { buildProfiles, type ProfilesReport } from '@/domain/research/clustering';
import { buildProfileVectors } from '@/domain/research/profileVectors';
import { EQUITY_ATTRIBUTES, equityGroup } from '@/domain/research/participant';
import type { AdminDeps, TrainingSnapshot } from '@/domain/research/ports';
import { consentedUserIds, daysAgoISO, requireRole, todayISO } from './access';

/** Lo que se guarda como métricas de cada brújula entrenada y se muestra en el panel. */
export interface CompassReport {
  version: string | null;
  trainedAt: string;
  n: number;
  positives: number;
  negatives: number;
  students: number;
  lambda: number | null;
  cv: { expert: ModelMetrics; trained: ModelMetrics } | null;
  weights: CompassTraining['weights'];
  equity: { trained: EquityReport; expert: EquityReport } | null;
  gate: { ready: boolean; reasons: string[] };
}

export interface ModelLab {
  active: string;
  /** Parámetros de la brújula entrenada activa (para el simulador), o null. */
  activeParams: TrainedParams | null;
  versions: { version: string; description: string; active: boolean; createdAt: string; report: CompassReport | null }[];
  dataset: { samples: number; positives: number; students: number; withProfile: number };
  forecast: ForecastBacktest;
  profiles: ProfilesReport | null;
}

const isReport = (m: unknown): m is CompassReport => !!m && typeof m === 'object' && 'gate' in m && 'weights' in m;

/** Historias de los estudiantes con consentimiento vigente, con su subgrupo para la equidad. */
export function historiesFrom(snap: TrainingSnapshot): StudentHistory[] {
  const consented = consentedUserIds(snap.consents);
  const map = new Map<string, StudentHistory>();
  const participant = new Map(snap.participants.map((p) => [p.user_id, { ageBand: p.age_band, gender: p.gender, semesterBand: p.semester_band }]));
  for (const p of snap.profiles) {
    if (!consented.has(p.user_id)) continue;
    map.set(p.user_id, {
      userId: p.user_id, checkins: [], missionDates: [], dailyGoal: p.daily_goal ?? 3, taskEvents: [], scales: [],
      group: equityGroup(p.archetype, participant.get(p.user_id) ?? null),
    });
  }
  for (const c of snap.checkins) map.get(c.user_id)?.checkins.push({
    date: c.checkin_date, mood: c.mood, stress: c.stress, energy: c.energy, social: c.social,
    sleepHours: c.sleep_hours === null ? null : Number(c.sleep_hours), localHour: c.checkin_local_hour ?? null, responseSeconds: c.response_seconds ?? null,
  });
  for (const m of snap.missions) map.get(m.user_id)?.missionDates.push(m.completed_date);
  for (const t of snap.tasks) map.get(t.user_id)?.taskEvents.push({
    date: t.occurred_date, missionId: t.mission_id, status: t.status as TaskStatus, category: t.category as TaskCategory, durationSeconds: Number(t.duration_seconds ?? 0),
  });
  for (const s of snap.scales) map.get(s.user_id)?.scales.push({ code: s.scale_code, raw: Number(s.raw_score), max: Number(s.max_score), answeredAt: s.answered_at.slice(0, 10) });
  return [...map.values()];
}

/** Entrena, valida, audita y registra (inactiva) una nueva brújula. Solo investigación. */
export async function trainCompassUseCase(deps: AdminDeps, userId: string): Promise<CompassReport> {
  await requireRole(deps, userId, 'investigador');
  const snap = await deps.repository.loadTrainingSnapshot(daysAgoISO(deps, 365));
  const samples = buildSamples(historiesFrom(snap));
  const training = trainCompass(samples, { now: deps.now() });
  const rowsFor = (key: 'trained' | 'expert') => training.oof!.y.map((y, i) => ({ y, p: training.oof![key][i], group: training.oof!.groups[i] }));
  const equity = training.oof
    ? { trained: auditEquity(rowsFor('trained'), EQUITY_ATTRIBUTES, THRESHOLD_MODERADO), expert: auditEquity(rowsFor('expert'), EQUITY_ATTRIBUTES, THRESHOLD_MODERADO) }
    : null;
  const report: CompassReport = {
    version: training.params?.version ?? null,
    trainedAt: deps.now().toISOString(),
    n: training.n,
    positives: training.positives,
    negatives: training.negatives,
    students: training.students,
    lambda: training.lambda,
    cv: training.cv,
    weights: training.weights,
    equity,
    gate: compassGate(training, equity?.trained.passed ?? false),
  };
  if (training.params) {
    await deps.repository.saveCompass({
      version: training.params.version,
      description: `Brújula entrenada (regresión logística MAP, λ = ${training.lambda}) con ${training.n} pergaminos WHO-5 de ${training.students} estudiantes.`,
      params: training.params,
      metrics: report,
    });
  }
  return report;
}

/** Activa una brújula entrenada que superó la compuerta, o vuelve al criterio experto ('decision-v4'). */
export async function activateCompassUseCase(deps: AdminDeps, userId: string, version: string) {
  await requireRole(deps, userId, 'investigador');
  await deps.repository.activateCompass(version);
}

export async function getModelLabUseCase(deps: AdminDeps, userId: string): Promise<ModelLab> {
  await requireRole(deps, userId, 'investigador');
  const [versions, snap] = await Promise.all([deps.repository.loadCompassVersions(), deps.repository.loadTrainingSnapshot(daysAgoISO(deps, 365))]);
  const histories = historiesFrom(snap);
  const samples = buildSamples(histories);
  const consented = consentedUserIds(snap.consents);
  const since90 = daysAgoISO(deps, 89);
  const series = histories.map((h) => h.checkins.filter((c) => c.date >= since90).sort((a, b) => a.date.localeCompare(b.date)).map((c) => c.mood));
  const activeRow = versions.find((v) => v.active);
  return {
    active: activeRow?.version ?? 'decision-v4',
    activeParams: activeRow && activeRow.version !== 'decision-v4' && isUsableParams(activeRow.params) ? activeRow.params : null,
    versions: versions.map((v) => ({ version: v.version, description: v.description, active: v.active, createdAt: v.createdAt, report: isReport(v.metrics) ? v.metrics : null })),
    dataset: {
      samples: samples.length,
      positives: samples.filter((s) => s.y === 1).length,
      students: new Set(samples.map((s) => s.userId)).size,
      withProfile: snap.participants.filter((p) => consented.has(p.user_id)).length,
    },
    forecast: backtestForecast(series),
    profiles: buildProfiles(buildProfileVectors({ checkins: snap.checkins, missions: snap.missions }, consented, todayISO(deps))),
  };
}
