/** Contratos del panel de investigación, independientes de React y de la persistencia. */
import type { StudentRow } from './aggregate';
import type { CheckinRecord, FactorExplanation } from '@/domain/wellbeing/types';
import type { MissionResponseRecord } from '@/domain/gamification/missionResponses';

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
  followUps?: { id: string; studentId: string; note: string; createdAt: string }[];
  /** Respuestas en misiones (solo psicología): quiz, pasos, reto y escritos autorizados. */
  responses?: MissionResponseRecord[];
  prediction?: { confidence: string | null; safetyFlags: string[]; protective: string[]; adjustments: { personal: number; protective: number; academic: number; hysteresis: string } | null } | null;
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
  /** Escalas respondidas en la ventana (WHO-5 cada 14 días), para el modelo y las alertas. */
  scales?: { user_id: string; scale_code: string; raw_score: number; max_score: number; answered_at: string }[];
  emails: Map<string, string>;
}
export type DetailSnapshot = Omit<StudentDetail, 'row' | 'explanation' | 'insufficientReason' | 'tasksByCategory'> & {
  tasks: { status: string; category: string }[];
};
export interface FollowUp { id: string; studentId: string; note: string; createdAt: string; }

/** Historia larga de los estudiantes para entrenar y evaluar modelos (fase 4). */
export interface TrainingSnapshot {
  profiles: { user_id: string; archetype: number | null; daily_goal: number | null }[];
  consents: ConsentRow[];
  checkins: StudentSnapshot['checkins'];
  missions: { user_id: string; completed_date: string }[];
  tasks: StudentSnapshot['tasks'];
  scales: NonNullable<StudentSnapshot['scales']>;
  /** Ficha opcional (solo la recibe el rol de investigación). */
  participants: { user_id: string; age_band: string; gender: string; semester_band: string }[];
}
export interface CompassVersionRow { version: string; description: string; active: boolean; createdAt: string; metrics: unknown; params: unknown }
export interface CalendarPeriod { id: string; label: string; start: string; end: string; kind: string; }
export interface DecisionSnapshot {
  calendar: CalendarPeriod[];
  predictions: { user_id: string; risk_level: string; generated_at: string }[];
  /** Solo se llena para psicología (RLS); para investigación queda vacío. */
  followUps: { student_id: string; created_at: string }[];
}
export interface AdminRepository {
  loadDecisionContext(since: string): Promise<DecisionSnapshot>;
  loadFollowUps(studentId: string): Promise<FollowUp[]>;
  addFollowUp(psychologistId: string, studentId: string, note: string): Promise<void>;
  addCalendarPeriod(userId: string, period: Omit<CalendarPeriod, 'id'>): Promise<void>;
  removeCalendarPeriod(id: string): Promise<void>;
  readAccess(userId: string): Promise<AdminAccess>;
  loadStudents(withEmails: boolean, since: string, sinceTs: string): Promise<StudentSnapshot>;
  loadDetail(userId: string, since: string): Promise<DetailSnapshot>;
  loadConsents(): Promise<ConsentRow[]>;
  loadDataset(dataset: Exclude<DatasetKey, 'resumen'>, ids: string[]): Promise<Record<string, unknown>[]>;
  /** Parámetros de la brújula entrenada activa (null = criterio experto). */
  loadActiveCompass(): Promise<unknown>;
  loadTrainingSnapshot(since: string): Promise<TrainingSnapshot>;
  loadCompassVersions(): Promise<CompassVersionRow[]>;
  saveCompass(v: { version: string; description: string; params: unknown; metrics: unknown }): Promise<void>;
  activateCompass(version: string): Promise<void>;
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

