/**
 * Actividad física del estudiante en Lovable Cloud — capa de Infraestructura.
 * Guarda los minutos registrados y entrega el resumen semanal calculado por el dominio.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { summarizeWeek, weekStart, type ActivityLog, type ActivityWeek, type Intensity } from "@/domain/wellbeing/activity";

type Db = SupabaseClient<Database>;

export interface ActivityPayload {
  week: ActivityWeek;
  logs: ActivityLog[]; // de esta semana, más recientes primero
}

const toLog = (r: { activity_date: string; minutes: number; intensity: string; strength: boolean }): ActivityLog => ({
  date: String(r.activity_date),
  minutes: Number(r.minutes),
  intensity: (r.intensity === "vigorosa" ? "vigorosa" : "moderada") as Intensity,
  strength: Boolean(r.strength),
});

/** Todos los registros (para logros: semanas que alcanzaron la meta). */
export async function loadActivityLogs(db: Db, userId: string): Promise<ActivityLog[]> {
  const { data } = await db.from("activity_logs").select("activity_date, minutes, intensity, strength").eq("user_id", userId)
    .order("activity_date", { ascending: false }).limit(2000);
  return (data ?? []).map(toLog);
}

/** Resumen de la semana actual (lunes a hoy). */
export async function loadActivityWeek(db: Db, userId: string, today: string): Promise<ActivityPayload> {
  const { data } = await db.from("activity_logs").select("activity_date, minutes, intensity, strength").eq("user_id", userId)
    .gte("activity_date", weekStart(today)).order("activity_date", { ascending: false }).order("created_at", { ascending: false });
  const logs = (data ?? []).map(toLog);
  return { week: summarizeWeek(logs, today), logs };
}

export async function insertActivity(db: Db, userId: string, log: ActivityLog) {
  const { error } = await db.from("activity_logs").insert({
    user_id: userId, activity_date: log.date, minutes: log.minutes, intensity: log.intensity, strength: log.strength,
  });
  if (error) throw new Error("No se pudo guardar tu actividad.");
}
