/**
 * Recomendaciones personalizadas — capa de Infraestructura.
 * Reúne el historial (misiones y check-ins de 90 días), deja que el dominio aprenda y recomiende,
 * y registra lo mostrado (solo con consentimiento) para evaluar el modelo.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { baseCategory, pathBlocker, visibleMissions } from "@/domain/gamification/missionsData";
import { isoDay } from "@/domain/gamification/progression";
import { getArchetypeStyle } from "@/domain/identity/archetype";
import type { TaskCategoryName } from "@/domain/gamification/rewards";
import { RECOMMENDER_VERSION, armStats, missionOutcomes, recommend, seededRandom, type ArmStats, type RecommendedMission } from "@/domain/wellbeing/recommender";
import { hasActiveConsent } from "./wellbeingRepository";

type Db = SupabaseClient<Database>;
const WINDOW_DAYS = 90;

export interface RecommendationsPayload {
  modelVersion: string;
  recommendations: RecommendedMission[];
  arms: ArmStats[];
  learning: boolean; // ya hay efectos medidos (check-ins después de misiones)
}

export async function loadRecommendations(db: Db, userId: string): Promise<RecommendationsPayload> {
  const today = isoDay(Date.now());
  const since = isoDay(Date.now(), -WINDOW_DAYS);
  const [profileRes, missionRes, checkinRes, consented] = await Promise.all([
    db.from("profiles").select("archetype, level").eq("user_id", userId).maybeSingle(),
    db.from("mission_completions").select("mission_id, category, completed_date").eq("user_id", userId).gte("completed_date", since).limit(2000),
    db.from("wellbeing_checkins").select("checkin_date, mood, stress").eq("user_id", userId).gte("checkin_date", since).limit(200),
    hasActiveConsent(db, userId),
  ]);
  const archetype = profileRes.data?.archetype ?? null;
  const level = profileRes.data?.level ?? 1;
  const style = getArchetypeStyle(archetype);
  const rows = missionRes.data ?? [];

  const outcomes = missionOutcomes(
    rows.map((r) => ({ date: String(r.completed_date), category: (r.category ?? "autocuidado") as TaskCategoryName })),
    (checkinRes.data ?? []).map((c) => ({ date: String(c.checkin_date), mood: Number(c.mood), stress: Number(c.stress) })),
  );
  const arms = armStats(outcomes, style.affinity);

  // Candidatas: misiones disponibles hoy (nivel, sin repetir hoy, ruta desbloqueada).
  const doneToday = new Set(rows.filter((r) => r.completed_date === today).map((r) => r.mission_id as string));
  const everDone = new Set(rows.map((r) => r.mission_id as string));
  const candidates = visibleMissions(archetype)
    .filter((m) => !doneToday.has(m.id) && (!m.requiredLevel || level >= m.requiredLevel) && !pathBlocker(m, everDone))
    .map((m) => ({ id: m.id, category: m.isAR ? "ar" as const : baseCategory(m) }));

  const recommendations = recommend({
    stats: arms,
    candidates,
    rand: seededRandom(`${userId}|${today}`),
    affinity: style.affinity,
    archetypeName: style.name,
  });

  // Registro para evaluar el modelo (una vez por misión y día; nunca sin consentimiento).
  if (consented && recommendations.length) {
    await db.from("recommendation_log").upsert(
      recommendations.map((r, i) => ({ user_id: userId, rec_date: today, mission_id: r.missionId, category: r.category, rank: i + 1, score: r.score, model_version: RECOMMENDER_VERSION })),
      { onConflict: "user_id,rec_date,mission_id", ignoreDuplicates: true },
    );
  }

  return { modelVersion: RECOMMENDER_VERSION, recommendations, arms, learning: outcomes.length > 0 };
}

/** Marca como aceptada la recomendación de hoy si el estudiante cumplió esa misión. */
export async function markRecommendationTaken(db: Db, userId: string, missionId: string, date: string) {
  await db.from("recommendation_log").update({ taken_at: new Date().toISOString() })
    .eq("user_id", userId).eq("rec_date", date).eq("mission_id", missionId).is("taken_at", null);
}

