/** Contratos del panel de investigación, independientes de React y de la persistencia. */
import type { StudentRow } from './aggregate';
import type { CheckinRecord, FactorExplanation } from '@/domain/wellbeing/types';

export interface AdminAccess {
  psicologo: boolean;
  investigador: boolean;
  isAdmin: boolean;
}

export interface StudentDetail {
  row: StudentRow;
  checkins: CheckinRecord[];
  explanation: FactorExplanation[];
  insufficientReason: string | null;
  predictions: { generatedAt: string; riskLevel: string; trend: string; score: number | null; coverage: number }[];
  missions: { title: string; completedAt: string; xp: number; isAr: boolean; category: string }[];
  tasksByCategory: { category: string; completed: number; skipped: number }[];
  timeline: { id: string; kind: string; title: string; detail: string | null; occurredAt: string }[];
  scales: { code: string; raw: number; max: number; answeredAt: string }[];
  world: { vitality: number; harmony: number; zonesUnlocked: number; season: string } | null;
  stats: { bienestar: number; resiliencia: number; energia: number; claridad: number } | null;
  attributes: Record<string, number> | null;
}

export const DATASETS = ["checkins", "task_events", "missions", "predictions", "scales", "resumen"] as const;
export type DatasetKey = (typeof DATASETS)[number];


export type AdminRole = 'psicologo' | 'investigador';
export interface ConsentRow { user_id: string; consent_version: string; revoked_at: string | null; }
export interface StudentSnapshot {
  profiles: { user_id: string; name: string | null; level: number | null; streak: number | null; archetype: number | null; daily_goal: number | null; last_mission_date: string | null }[];
  consents: ConsentRow[];
  checkins: { user_id: string; checkin_date: string; mood: number; stress: number; energy: number; social: number; sleep_hours: number | null; checkin_local_hour?: number | null; response_seconds?: number | null }[];
  missions: { user_id: string; completed_date: string; completed_at: string }[];
  tasks: { user_id: string; occurred_date: string; mission_id: string; status: string; category: string; duration_seconds: number }[];
  emails: Map<string, string>;
}
export type DetailSnapshot = Omit<StudentDetail, 'row' | 'explanation' | 'insufficientReason' | 'tasksByCategory'> & {
  tasks: { status: string; category: string }[];
};
export interface AdminRepository {
  readAccess(userId: string): Promise<AdminAccess>;
  loadStudents(withEmails: boolean, since: string, sinceTs: string): Promise<StudentSnapshot>;
  loadDetail(userId: string, since: string): Promise<DetailSnapshot>;
  loadConsents(): Promise<ConsentRow[]>;
  loadDataset(dataset: Exclude<DatasetKey, 'resumen'>, ids: string[]): Promise<Record<string, unknown>[]>;
}
export interface AdminDeps { repository: AdminRepository; now: () => Date; }

/** Campos permitidos: no se exporta texto libre ni identidad directa. */
export const DATASET_COLUMNS = {
      checkins: "user_id, checkin_date, mood, stress, energy, social, sleep_hours, checkin_local_hour, response_seconds",
      task_events: "user_id, occurred_date, mission_id, status, category, duration_seconds, is_ar",
      missions: "user_id, completed_date, mission_id, title, category, xp_earned, is_ar",
      predictions: "user_id, generated_at, model_version, feature_version, score, risk_level, trend, trend_delta, coverage",
      scales: "user_id, scale_code, raw_score, max_score, answered_at",
} as const;

