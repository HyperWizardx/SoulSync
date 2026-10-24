/** Casos de uso del panel: permisos, consentimiento, señales y exportación por puertos. */
import { runInference } from '@/domain/wellbeing/inference';
import { CONSENT_VERSION } from '@/domain/wellbeing/types';
import type { CheckinRecord, PredictionInput, TaskCategory, TaskStatus, FactorExplanation } from '@/domain/wellbeing/types';
import { aggregatePopulation, participantCode, toCsv, type StudentRow } from '@/domain/research/aggregate';
import { DATASET_COLUMNS, type AdminDeps, type AdminRole, type StudentDetail, type DatasetKey } from '@/domain/research/ports';

export const getAdminAccessUseCase = (deps: AdminDeps, userId: string) => deps.repository.readAccess(userId);
async function requireRole(deps: AdminDeps, userId: string, role: AdminRole) {
  const access = await deps.repository.readAccess(userId);
  if (!access[role]) throw new Error('Acceso restringido: no tienes permisos de administración para esta vista.');
}
const todayISO = (deps: AdminDeps) => deps.now().toISOString().slice(0, 10);
const daysAgoISO = (deps: AdminDeps, n: number) => new Date(deps.now().getTime() - n * 86_400_000).toISOString().slice(0, 10);

function consentState(row: { consent_version: string; revoked_at: string | null } | undefined) {
  if (!row) return "ninguno" as const;
  if (row.revoked_at) return "revocado" as const;
  return row.consent_version === CONSENT_VERSION ? ("vigente" as const) : ("desactualizado" as const);
}

function buildInput(
  today: string,
  checkins: CheckinRecord[],
  missionsByDate: Record<string, number>,
  dailyGoal: number,
  lastMissionDate: string | null,
  taskEvents: { date: string; missionId: string; status: TaskStatus; category: TaskCategory; durationSeconds: number }[],
): PredictionInput {
  return {
    today,
    checkins,
    telemetry: { missionsByDate, dailyGoal, lastMissionDate },
    taskEvents,
  };
}

/** Índice que agrupa filas por user_id. */
function groupBy<T extends { user_id: string }>(rows: T[] | null): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows ?? []) {
    const list = map.get(r.user_id);
    if (list) list.push(r);
    else map.set(r.user_id, [r]);
  }
  return map;
}


async function loadStudentRows(deps: AdminDeps, withEmails: boolean): Promise<StudentRow[]> {
  const today = todayISO(deps);
  const { profiles, consents, checkins, missions, tasks, emails } = await deps.repository.loadStudents(
    withEmails, daysAgoISO(deps, 13), new Date(deps.now().getTime() - 13 * 86_400_000).toISOString(),
  );
  const consentByUser = new Map<string, { consent_version: string; revoked_at: string | null }>();
  for (const c of consents) if (!consentByUser.has(c.user_id)) consentByUser.set(c.user_id, c);

  const checkinsByUser = groupBy(checkins);
  const missionsByUser = groupBy(missions);
  const tasksByUser = groupBy(tasks);

  return profiles.map((p) => {
    const consent = consentState(consentByUser.get(p.user_id));
    const userCheckins: CheckinRecord[] = (checkinsByUser.get(p.user_id) ?? []).map((c) => ({
      date: c.checkin_date,
      mood: c.mood,
      stress: c.stress,
      energy: c.energy,
      social: c.social,
      sleepHours: c.sleep_hours === null ? null : Number(c.sleep_hours),
      localHour: c.checkin_local_hour ?? null,
      responseSeconds: c.response_seconds ?? null,
    }));
    const userMissions = missionsByUser.get(p.user_id) ?? [];
    const userTasks = tasksByUser.get(p.user_id) ?? [];

    const missionsByDate: Record<string, number> = {};
    for (const m of userMissions) missionsByDate[m.completed_date] = (missionsByDate[m.completed_date] ?? 0) + 1;

    const within7 = (d: string) =>
      (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${d}T00:00:00Z`)) / 86_400_000 < 7;
    const missions7 = userMissions.filter((m) => within7(m.completed_date)).length;
    const skipped7 = userTasks.filter((t) => t.status === "skipped" && within7(t.occurred_date)).length;
    const goal = Math.max(1, p.daily_goal ?? 3);

    const base = {
      userId: p.user_id as string,
      participantCode: participantCode(p.user_id),
      name: (p.name as string) ?? "Héroe",
      email: withEmails ? (emails.get(p.user_id) ?? null) : null,
      level: (p.level as number) ?? 1,
      streak: (p.streak as number) ?? 0,
      archetype: (p.archetype as number | null) ?? null,
      consent,
      checkins14: userCheckins.length,
      missions7,
      skipped7,
      adherence7: userMissions.length === 0 && userTasks.length === 0 ? null : Math.min(1, missions7 / (goal * 7)),
      lastCheckin: userCheckins.map((c) => c.date).sort().at(-1) ?? null,
      lastActivity:
        [...userMissions.map((m) => m.completed_at as string)].sort().at(-1) ??
        (p.last_mission_date ? `${p.last_mission_date}T00:00:00Z` : null),
    };

    if (consent !== "vigente") {
      return { ...base, riskLevel: null, score: null, trend: null, coverage: 0 } satisfies StudentRow;
    }

    const prediction = runInference(
      buildInput(
        today,
        userCheckins,
        missionsByDate,
        goal,
        (p.last_mission_date as string | null) ?? null,
        userTasks.map((t) => ({
          date: t.occurred_date,
          missionId: t.mission_id,
          status: t.status as TaskStatus,
          category: t.category as TaskCategory,
          durationSeconds: Number(t.duration_seconds ?? 0),
        })),
      ),
    );

    return {
      ...base,
      riskLevel: prediction.riskLevel,
      score: prediction.score,
      trend: prediction.trend,
      coverage: prediction.coverage,
    } satisfies StudentRow;
  });
}

export async function listStudentsUseCase(deps: AdminDeps, userId: string): Promise<StudentRow[]> {
  await requireRole(deps, userId, 'psicologo');
  const rows = await loadStudentRows(deps, true);
    return rows.sort((a, b) => {
      const order: Record<string, number> = { alto: 0, moderado: 1, bajo: 2, insuficiente: 3 };
      const ra = a.riskLevel ? order[a.riskLevel] : 4;
      const rb = b.riskLevel ? order[b.riskLevel] : 4;
      return ra - rb || a.name.localeCompare(b.name);
    });
}

export async function getPopulationMetricsUseCase(deps: AdminDeps, userId: string) {
  await requireRole(deps, userId, 'investigador');
  const rows = (await loadStudentRows(deps, false)).map(r => ({ ...r, name: r.participantCode, email: null }));
  return { metrics: aggregatePopulation(rows, todayISO(deps)), rows };
}

export async function getStudentDetailUseCase(deps: AdminDeps, userId: string, targetId: string): Promise<StudentDetail> {
  await requireRole(deps, userId, 'psicologo');
  const [rows, snapshot] = await Promise.all([
    loadStudentRows(deps, true), deps.repository.loadDetail(targetId, daysAgoISO(deps, 29)),
  ]);
  const row = rows.find(r => r.userId === targetId);
  if (!row) throw new Error('Estudiante no encontrado.');
  const { tasks, ...detail } = snapshot;
  let explanation: FactorExplanation[] = [];
  let insufficientReason: string | null = null;
  if (row.consent === 'vigente') {
    const prediction = runInference(buildInput(todayISO(deps), detail.checkins, {}, 3, null,
      tasks.map(t => ({ date: todayISO(deps), missionId: '', status: t.status as TaskStatus, category: t.category as TaskCategory, durationSeconds: 0 })),
    ));
    explanation = prediction.explanation;
    insufficientReason = prediction.insufficientReason ?? null;
  }
  const byCat = new Map<string, { completed: number; skipped: number }>();
  for (const t of tasks) {
    const entry = byCat.get(t.category) ?? { completed: 0, skipped: 0 };
    if (t.status === 'completed') entry.completed += 1;
    if (t.status === 'skipped') entry.skipped += 1;
    byCat.set(t.category, entry);
  }
  return { row, ...detail, explanation, insufficientReason, tasksByCategory: [...byCat.entries()].map(([category, v]) => ({ category, ...v })) };
}

export async function exportDatasetUseCase(deps: AdminDeps, userId: string, dataset: DatasetKey) {
  await requireRole(deps, userId, 'investigador');
  const consents = await deps.repository.loadConsents();
  const allowed = new Set<string>();
  const seen = new Set<string>();
  for (const c of consents) {
    if (seen.has(c.user_id)) continue;
    seen.add(c.user_id);
    if (!c.revoked_at && c.consent_version === CONSENT_VERSION) allowed.add(c.user_id);
  }
  if (dataset === 'resumen') {
    const rows = (await loadStudentRows(deps, false)).filter(r => allowed.has(r.userId));
    return { filename: 'soulsync_resumen.csv', rows: rows.length, csv: toCsv(
      ['participante', 'nivel', 'racha', 'riesgo', 'score', 'tendencia', 'cobertura', 'checkins_14d', 'misiones_7d', 'omitidas_7d', 'adherencia_7d'],
      rows.map(r => [r.participantCode, r.level, r.streak, r.riskLevel, r.score, r.trend, r.coverage, r.checkins14, r.missions7, r.skipped7, r.adherence7]),
    ) };
  }
  if (!allowed.size) return { filename: `soulsync_${dataset}.csv`, csv: '', rows: 0 };
  const rows = await deps.repository.loadDataset(dataset, [...allowed]);
  const headers = DATASET_COLUMNS[dataset].split(',').map(c => c.trim());
  const csv = toCsv(headers.map(h => h === 'user_id' ? 'participante' : h), rows.map(r =>
    headers.map(h => h === 'user_id' ? participantCode(String(r['user_id'])) : r[h] as string | number | null),
  ));
  return { filename: `soulsync_${dataset}.csv`, csv, rows: rows.length };
}
