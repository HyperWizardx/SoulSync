/**
 * Puertos (interfaces) del contexto Bienestar — capa de Dominio.
 * El dominio define QUÉ necesita; la Infraestructura decide CÓMO (Lovable Cloud).
 * Principios: Inversión de Dependencias (D) y Segregación de Interfaces (I).
 */
import type { TaskCategory, TaskStatus } from "./types";

/** Datos de un check-in diario (escalas 1–5, sueño opcional). */
export interface CheckinInput {
  mood: number;
  stress: number;
  energy: number;
  social: number;
  sleepHours?: number | null;
}

/** Evento del ciclo de vida de una tarea/misión. */
export interface TaskEventInput {
  missionId: string;
  title: string;
  status: TaskStatus;
  category: TaskCategory;
  durationSeconds: number;
  isAR: boolean;
}

/** Entrada de la historia unificada (sin texto libre del usuario). */
export interface TimelineInput {
  kind: "checkin" | "task_completed" | "task_skipped" | "prediction_change" | "milestone" | "world_change";
  title: string;
  detail?: string | null;
  payload?: Record<string, unknown>;
}

/** Gestión del consentimiento informado de investigación. */
export interface ConsentRepository {
  hasActiveConsent(userId: string): Promise<boolean>;
  accept(userId: string, wearablesOptIn: boolean): Promise<void>;
  /** Revoca y elimina los datos del módulo (minimización de datos). */
  revokeAndPurge(userId: string): Promise<void>;
}

/** Persistencia de la serie temporal (check-ins, tareas, timeline). */
export interface WellbeingEventRepository {
  upsertCheckin(userId: string, date: string, input: CheckinInput): Promise<void>;
  insertTaskEvent(userId: string, date: string, input: TaskEventInput): Promise<void>;
  addTimeline(userId: string, entry: TimelineInput): Promise<void>;
}

/** Lectura del estado agregado (incluye inferencia) en un tipo P definido fuera del dominio. */
export interface WellbeingReader<P> {
  load(userId: string): Promise<P>;
}
