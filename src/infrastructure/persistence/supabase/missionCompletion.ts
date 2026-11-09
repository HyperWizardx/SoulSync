/**
 * Registro de una misión completada — capa de Infraestructura.
 * La recompensa sale SIEMPRE del catálogo de misiones (no del teléfono) y la afinidad del
 * arquetipo guardado en el perfil suma XP. Lo usan la server function y la herramienta MCP.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getMissionById, missionCategory } from "@/domain/gamification/missionsData";
import { isEffectActive } from "@/domain/gamification/progression";
import { isAffine } from "@/domain/identity/archetype";
import { planMissionCompletion } from "@/application/gamification/completeMission";
import { addTimelineEvent, hasActiveConsent } from "./wellbeingRepository";
import { consumeUses, evaluateAndGrant } from "./gamificationRepository";

type Db = SupabaseClient<Database>;

export class UnknownMissionError extends Error {
  constructor(id: string) { super(`Misión desconocida: ${id}`); }
}

export async function completeCatalogMission(db: Db, userId: string, input: { missionId: string; durationSeconds?: number }) {
  const mission = getMissionById(input.missionId);
  if (!mission) throw new UnknownMissionError(input.missionId);
  const category = missionCategory(mission);
  const isAR = mission.isAR ?? false;
  const r = mission.reward;

  // 1. Estado actual y objetos activos/equipados.
  const [pRes, sRes, aRes, efRes, invRes] = await Promise.all([
    db.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    db.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
    db.from("user_attributes").select("*").eq("user_id", userId).maybeSingle(),
    db.from("item_effects").select("*").eq("user_id", userId),
    db.from("inventory").select("*").eq("user_id", userId).eq("equipped", true),
  ]);
  if (!pRes.data || !sRes.data || !aRes.data) throw new Error("Perfil no inicializado");
  const p = pRes.data, s = sRes.data, a = aRes.data;
  if (mission.requiredLevel && p.level < mission.requiredLevel) throw new Error(`Requiere nivel ${mission.requiredLevel}`);

  const effects = (efRes.data ?? [])
    .map((row) => ({
      id: row.id as string,
      item_key: row.item_key as string,
      effect: row.effect as string,
      magnitude: Number(row.magnitude),
      uses_left: (row.uses_left as number | null) ?? null,
      expires_at: (row.expires_at as string | null) ?? null,
    }))
    .filter((e) => isEffectActive(e));
  const equippedKeys = (invRes.data ?? []).map((row) => (row.item_key as string | null) ?? "");
  const affinity = isAffine(p.archetype, category);

  // 2. Caso de uso: cálculo puro del resultado con la recompensa del catálogo.
  const plan = planMissionCompletion(
    {
      xp: p.xp, level: p.level, coins: p.coins, gems: p.gems, streak: p.streak, lastMissionDate: p.last_mission_date,
      stats: { bienestar: s.bienestar, resiliencia: s.resiliencia, energia: s.energia, claridad: s.claridad },
      attributes: {
        resiliencia: a.resiliencia, empatia: a.empatia, mindfulness: a.mindfulness,
        autoconocimiento: a.autoconocimiento, conexion_social: a.conexion_social, creatividad: a.creatividad,
      },
    },
    {
      xp: r.xp ?? 0, coins: r.coins ?? 0, gems: r.gems ?? 0, stats: r.stats ?? {},
      attributes: {
        resiliencia: r.attributes?.resiliencia, empatia: r.attributes?.empatia, mindfulness: r.attributes?.mindfulness,
        autoconocimiento: r.attributes?.autoconocimiento, conexion_social: r.attributes?.conexionSocial, creatividad: r.attributes?.creatividad,
      },
    },
    effects,
    equippedKeys,
    Date.now(),
    affinity,
  );

  // 3. Persistir gamificación.
  const results = await Promise.all([
    db.from("profiles").update(plan.profile).eq("user_id", userId),
    db.from("user_stats").update(plan.stats).eq("user_id", userId),
    db.from("user_attributes").update(plan.attributes).eq("user_id", userId),
    db.from("mission_completions").insert({
      user_id: userId, mission_id: mission.id, title: mission.title, xp_earned: plan.gainedXp,
      is_ar: isAR, category, completed_date: plan.today,
    }),
  ]);
  const err = results.find((res) => res.error)?.error;
  if (err) throw new Error(err.message);

  // 4. Telemetría de bienestar (solo con consentimiento) y logros, en paralelo: tablas distintas.
  const recordTelemetry = async () => {
    const [, consented] = await Promise.all([consumeUses(db, plan.effectsToConsume), hasActiveConsent(db, userId)]);
    if (!consented) return;
    await Promise.all([
      db.from("task_events").insert({
        user_id: userId, mission_id: mission.id, title: mission.title, category, status: "completed",
        duration_seconds: input.durationSeconds ?? 0, is_ar: isAR, occurred_date: plan.today,
      }),
      addTimelineEvent(db, userId, {
        kind: "task_completed",
        title: `Tarea completada: ${mission.title}`,
        detail: `+${plan.gainedXp} XP · categoría ${category}${plan.boosted ? " · con objeto activo" : ""}${affinity ? " · afín a tu arquetipo" : ""}`,
        payload: { missionId: mission.id, xp: plan.gainedXp, isAR, boosted: plan.boosted, affinity },
      }),
    ]);
    // El hito va después de la tarea para que el historial los muestre en orden.
    if (plan.leveledUp) {
      await addTimelineEvent(db, userId, {
        kind: "milestone", title: `Subiste a nivel ${plan.profile.level}`,
        detail: "Hito de gamificación alcanzado", payload: { level: plan.profile.level },
      });
    }
  };
  const [unlocked] = await Promise.all([
    evaluateAndGrant(db, userId, { level: plan.profile.level, streak: plan.profile.streak }),
    recordTelemetry(),
  ]);

  return {
    leveledUp: plan.leveledUp,
    newLevel: plan.profile.level,
    xp: plan.profile.xp,
    streak: plan.profile.streak,
    unlockedAchievements: unlocked,
    gainedXp: plan.gainedXp,
    gainedCoins: plan.gainedCoins,
    gainedGems: r.gems ?? 0,
    boosted: plan.boosted,
    affinity,
  };
}
