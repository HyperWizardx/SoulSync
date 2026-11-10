/**
 * Alertas priorizadas del panel de psicología: convierte las filas de estudiantes en una cola
 * ordenada (urgente → atención → vigilar) y marca si el seguimiento está pendiente según una
 * ventana por prioridad. Solo usa estudiantes con consentimiento vigente. Función pura.
 */
import { who5Band } from '@/domain/wellbeing/who5';
import type { StudentRow } from './aggregate';

export type AlertPriority = 'urgente' | 'atencion' | 'vigilar';

/** Días máximos sin un seguimiento registrado antes de marcarlo como pendiente. */
export const FOLLOW_UP_WINDOW_DAYS: Record<AlertPriority, number> = { urgente: 2, atencion: 7, vigilar: 14 };
/** Días sin check-in (habiendo registrado antes) que cuentan como desconexión. */
export const INACTIVE_DAYS = 5;

export interface StudentAlert {
  userId: string;
  name: string;
  participantCode: string;
  priority: AlertPriority;
  reasons: string[];
  lastFollowUp: string | null;
  /** Días desde el último seguimiento (null si nunca hubo). */
  daysSinceFollowUp: number | null;
  followUpPending: boolean;
}

const ORDER: Record<AlertPriority, number> = { urgente: 0, atencion: 1, vigilar: 2 };
const DAY = 86_400_000;
/** Días de calendario entre una fecha (o marca de tiempo) y ahora. */
const daysBetween = (from: string, now: Date) => Math.floor((now.getTime() - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / DAY);

/** Prioridad y motivos de un estudiante, o null si no necesita alerta. */
export function alertFor(row: StudentRow, now: Date): { priority: AlertPriority; reasons: string[] } | null {
  if (row.consent !== 'vigente') return null;
  const urgent: string[] = [];
  const attention: string[] = [];
  const watch: string[] = [];

  if ((row.safetyFlags ?? 0) > 0) urgent.push(row.safetyFlags === 1 ? 'Regla de seguridad activa' : `${row.safetyFlags} reglas de seguridad activas`);
  if (row.who5Raw !== undefined && row.who5Raw !== null) {
    const band = who5Band(row.who5Raw);
    if (band === 'muy_bajo') urgent.push(`WHO-5 muy bajo (${row.who5Raw}/25)`);
    else if (band === 'bajo') attention.push(`WHO-5 bajo (${row.who5Raw}/25)`);
  }
  if (row.riskLevel === 'alto') attention.push('Señal alta del modelo');
  if (row.riskLevel === 'moderado' && row.trend === 'empeorando') watch.push('Señal moderada en aumento');
  if (row.forecastDip) watch.push('Pronóstico: posible bajada de ánimo');
  if (row.lastCheckin) {
    const idle = daysBetween(row.lastCheckin, now);
    if (idle >= INACTIVE_DAYS) watch.push(`Sin check-in hace ${idle} días`);
  } else if (row.lastActivity) {
    // Sin check-ins en las últimas 4 semanas: la desconexión se mide con la última misión.
    const idle = daysBetween(row.lastActivity, now);
    if (idle >= INACTIVE_DAYS) watch.push(`Sin actividad hace ${idle} días`);
  }

  if (urgent.length) return { priority: 'urgente', reasons: [...urgent, ...attention, ...watch] };
  if (attention.length) return { priority: 'atencion', reasons: [...attention, ...watch] };
  if (watch.length) return { priority: 'vigilar', reasons: watch };
  return null;
}

/** Cola priorizada: prioridad, luego pendientes, luego el seguimiento más antiguo primero. */
export function buildAlerts(rows: StudentRow[], now: Date): StudentAlert[] {
  const alerts: StudentAlert[] = [];
  for (const row of rows) {
    const a = alertFor(row, now);
    if (!a) continue;
    const lastFollowUp = row.lastFollowUp ?? null;
    const daysSinceFollowUp = lastFollowUp ? daysBetween(lastFollowUp, now) : null;
    alerts.push({
      userId: row.userId,
      name: row.name,
      participantCode: row.participantCode,
      priority: a.priority,
      reasons: a.reasons,
      lastFollowUp,
      daysSinceFollowUp,
      followUpPending: daysSinceFollowUp === null || daysSinceFollowUp > FOLLOW_UP_WINDOW_DAYS[a.priority],
    });
  }
  return alerts.sort((x, y) =>
    ORDER[x.priority] - ORDER[y.priority]
    || Number(y.followUpPending) - Number(x.followUpPending)
    || (y.daysSinceFollowUp ?? Infinity) - (x.daysSinceFollowUp ?? Infinity)
    || x.name.localeCompare(y.name),
  );
}
