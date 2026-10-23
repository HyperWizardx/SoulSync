/**
 * Acceso a datos de gamificación en Lovable Cloud — capa de Infraestructura.
 * Reúne el contexto de logros, entrega recompensas y consume usos de objetos.
 * Las reglas (qué logro se desbloquea, cómo sube el nivel) viven en el Dominio.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { REWARD_BY_RARITY, evaluateAchievements, type AchievementContext } from "@/domain/gamification/achievements";
import { applyXp } from "@/domain/gamification/progression";

export type Db = SupabaseClient<Database>;

/** Descuenta un uso a los efectos consumibles y borra los agotados. */
export async function consumeUses(db: Db, rows: Array<{ id: string; uses_left: number | null }>) {
  for (const r of rows) {
    const left = (r.uses_left ?? 1) - 1;
    if (left <= 0) await db.from("item_effects").delete().eq("id", r.id);
    else await db.from("item_effects").update({ uses_left: left }).eq("id", r.id);
  }
}

/** Reúne el contexto real del usuario para evaluar los logros. */
export async function buildAchievementContext(
  db: Db,
  userId: string,
  overrides: Partial<AchievementContext> = {},
): Promise<AchievementContext> {
  const today = new Date().toISOString().slice(0, 10);
  const [profRes, misRes, checkRes, predRes, worldRes, invRes] = await Promise.all([
    db.from("profiles").select("level,streak,daily_goal").eq("user_id", userId).maybeSingle(),
    db.from("mission_completions").select("category,is_ar,completed_date").eq("user_id", userId).limit(2000),
    db.from("wellbeing_checkins").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("wellbeing_predictions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("world_state").select("zones_unlocked").eq("user_id", userId).maybeSingle(),
    db.from("inventory").select("quantity").eq("user_id", userId),
  ]);

  // Conteos por categoría y por día a partir del historial de misiones.
  const missionsRows = misRes.data ?? [];
  const byCategory: Record<string, number> = {};
  const byDate: Record<string, number> = {};
  let missionsAR = 0;
  for (const m of missionsRows) {
    const c = (m.category as string | null) ?? "autocuidado";
    byCategory[c] = (byCategory[c] ?? 0) + 1;
    const d = (m.completed_date as string | null) ?? today;
    byDate[d] = (byDate[d] ?? 0) + 1;
    if (m.is_ar) missionsAR += 1;
  }
  const dailyGoal = Math.max(1, (profRes.data?.daily_goal as number | undefined) ?? 3);
  const goalDays = Object.values(byDate).filter((n) => n >= dailyGoal).length;
  const categoriesWith5 = ["autocuidado", "reflexion", "movimiento", "social", "cognitivo"].filter(
    (c) => (byCategory[c] ?? 0) >= 5,
  ).length;
  const purchases = (invRes.data ?? []).reduce((s, r) => s + ((r.quantity as number | null) ?? 1), 0);

  return {
    missions: missionsRows.length,
    missionsAR,
    streak: profRes.data?.streak ?? 0,
    level: profRes.data?.level ?? 1,
    byCategory,
    categoriesWith5,
    checkins: checkRes.count ?? 0,
    predictions: predRes.count ?? 0,
    goalDays,
    zonesUnlocked: (worldRes.data?.zones_unlocked as number | undefined) ?? 0,
    purchases,
    itemsUsed: 0,
    ...overrides,
  };
}

/** Desbloquea logros pendientes y entrega su recompensa (una sola vez). */
async function grantAchievements(db: Db, userId: string, ctx: AchievementContext) {
  const { data: ownedRows } = await db.from("achievements").select("code").eq("user_id", userId);
  const owned = (ownedRows ?? []).map((r) => r.code as string);
  const pending = evaluateAchievements(ctx, owned);
  if (pending.length === 0) return [];

  let xpTotal = 0;
  let coinTotal = 0;
  let gemTotal = 0;
  const rows = pending.map((a) => {
    const reward = REWARD_BY_RARITY[a.rarity];
    xpTotal += reward.xp;
    coinTotal += reward.coins;
    gemTotal += reward.gems;
    return { user_id: userId, code: a.code, reward_xp: reward.xp, reward_coins: reward.coins, reward_gems: reward.gems };
  });
  const { error } = await db.from("achievements").insert(rows);
  if (error) return [];

  const { data: prof } = await db.from("profiles").select("xp,level,coins,gems").eq("user_id", userId).maybeSingle();
  if (prof) {
    const { xp, level } = applyXp(prof.xp as number, prof.level as number, xpTotal);
    await db
      .from("profiles")
      .update({ xp, level, coins: (prof.coins as number) + coinTotal, gems: (prof.gems as number) + gemTotal })
      .eq("user_id", userId);
  }
  return pending;
}

/** Evalúa y concede logros en un solo paso; devuelve los códigos nuevos. */
export async function evaluateAndGrant(db: Db, userId: string, overrides: Partial<AchievementContext> = {}) {
  const ctx = await buildAchievementContext(db, userId, overrides);
  const unlocked = await grantAchievements(db, userId, ctx);
  return unlocked.map((a) => a.code);
}
