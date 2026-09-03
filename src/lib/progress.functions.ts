import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addTimelineEvent, hasActiveConsent } from "@/lib/wellbeing/load";
import { getItem, getItemByName, MAX_EQUIPPED, type ItemEffect } from "@/lib/items";
import {
  REWARD_BY_RARITY,
  evaluateAchievements,
  type AchievementContext,
} from "@/lib/achievements";
import type { Database } from "@/integrations/supabase/types";

type SupabaseLike = SupabaseClient<Database>;

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const XP_PER_LEVEL = 600;


export type ProgressPayload = {
  profile: {
    user_id: string;
    name: string;
    avatar: number;
    archetype: number | null;
    level: number;
    xp: number;
    coins: number;
    gems: number;
    streak: number;
    last_mission_date: string | null;
    onboarded: boolean;
    daily_goal: number;
    theme: string;
    text_size: string;
  };
  stats: { bienestar: number; resiliencia: number; energia: number; claridad: number };
  attributes: {
    resiliencia: number; empatia: number; mindfulness: number;
    autoconocimiento: number; conexion_social: number; creatividad: number;
  };
  history: Array<{
    id: string; mission_id: string; title: string; xp_earned: number;
    is_ar: boolean; completed_at: string; completed_date: string;
  }>;
  inventory: string[];
  items: InventoryItem[];
  effects: ActiveEffect[];
  achievements: string[];
};

export type InventoryItem = {
  id: string;
  item_key: string;
  item_name: string;
  quantity: number;
  kind: string;
  equipped: boolean;
};

export type ActiveEffect = {
  id: string;
  item_key: string;
  effect: string;
  magnitude: number;
  uses_left: number | null;
  expires_at: string | null;
};

function isEffectActive(e: { uses_left: number | null; expires_at: string | null }) {
  if (e.uses_left !== null && e.uses_left <= 0) return false;
  if (e.expires_at !== null && Date.parse(e.expires_at) < Date.now()) return false;
  return true;
}


export const getProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProgressPayload> => {
    const { supabase, userId } = context;
    const [pRes, sRes, aRes, hRes, iRes, achRes, efRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_attributes").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("mission_completions")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(50),
      supabase.from("inventory").select("*").eq("user_id", userId),
      supabase.from("achievements").select("code").eq("user_id", userId),
      supabase.from("item_effects").select("*").eq("user_id", userId),
    ]);


    // Self-heal: if signup trigger missed (e.g. legacy users), create rows.
    if (!pRes.data) {
      await supabase.from("profiles").insert({ user_id: userId });
    }
    if (!sRes.data) await supabase.from("user_stats").insert({ user_id: userId });
    if (!aRes.data) await supabase.from("user_attributes").insert({ user_id: userId });

    const profile = pRes.data ?? {
      user_id: userId, name: "Héroe", avatar: 0, archetype: null,
      level: 1, xp: 0, coins: 100, gems: 5, streak: 0, last_mission_date: null,
      onboarded: false, daily_goal: 3, theme: "dark", text_size: "normal",
    };
    const stats = sRes.data ?? { bienestar: 50, resiliencia: 50, energia: 50, claridad: 50 };
    const attrs = aRes.data ?? {
      resiliencia: 30, empatia: 30, mindfulness: 30,
      autoconocimiento: 30, conexion_social: 30, creatividad: 30,
    };

    return {
      profile: {
        user_id: profile.user_id,
        name: profile.name,
        avatar: profile.avatar,
        archetype: profile.archetype,
        level: profile.level,
        xp: profile.xp,
        coins: profile.coins,
        gems: profile.gems,
        streak: profile.streak,
        last_mission_date: profile.last_mission_date,
        onboarded: profile.onboarded ?? false,
        daily_goal: profile.daily_goal ?? 3,
        theme: profile.theme ?? "dark",
        text_size: profile.text_size ?? "normal",
      },
      stats: {
        bienestar: stats.bienestar,
        resiliencia: stats.resiliencia,
        energia: stats.energia,
        claridad: stats.claridad,
      },
      attributes: {
        resiliencia: attrs.resiliencia,
        empatia: attrs.empatia,
        mindfulness: attrs.mindfulness,
        autoconocimiento: attrs.autoconocimiento,
        conexion_social: attrs.conexion_social,
        creatividad: attrs.creatividad,
      },
      history: (hRes.data ?? []).map((h) => ({
        id: h.id, mission_id: h.mission_id, title: h.title,
        xp_earned: h.xp_earned, is_ar: h.is_ar,
        completed_at: h.completed_at, completed_date: h.completed_date,
      })),
      inventory: (iRes.data ?? []).map((r) => r.item_name),
      items: (iRes.data ?? []).map((r) => ({
        id: r.id as string,
        item_key: (r.item_key as string | null) ?? "",
        item_name: r.item_name as string,
        quantity: (r.quantity as number | null) ?? 1,
        kind: (r.kind as string | null) ?? "consumable",
        equipped: Boolean(r.equipped),
      })),
      effects: (efRes.data ?? [])
        .map((r) => ({
          id: r.id as string,
          item_key: r.item_key as string,
          effect: r.effect as string,
          magnitude: Number(r.magnitude),
          uses_left: (r.uses_left as number | null) ?? null,
          expires_at: (r.expires_at as string | null) ?? null,
        }))
        .filter(isEffectActive),
      achievements: (achRes.data ?? []).map((r) => r.code),

    };
  });

const ProfileUpdate = z.object({
  name: z.string().min(1).max(40).optional(),
  avatar: z.number().int().min(0).max(20).optional(),
  archetype: z.number().int().min(0).max(10).nullable().optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ProfileUpdate.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const MissionRewardSchema = z.object({
  missionId: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  isAR: z.boolean().default(false),
  xp: z.number().int().min(0).max(500).default(0),
  coins: z.number().int().min(0).max(500).default(0),
  gems: z.number().int().min(0).max(20).default(0),
  stats: z.object({
    bienestar: z.number().int().min(-20).max(20).optional(),
    resiliencia: z.number().int().min(-20).max(20).optional(),
    energia: z.number().int().min(-20).max(20).optional(),
    claridad: z.number().int().min(-20).max(20).optional(),
  }).default({}),
  category: z
    .enum(["autocuidado", "reflexion", "movimiento", "social", "cognitivo", "ar"])
    .default("autocuidado"),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
  attributes: z.object({
    resiliencia: z.number().int().min(-20).max(20).optional(),
    empatia: z.number().int().min(-20).max(20).optional(),
    mindfulness: z.number().int().min(-20).max(20).optional(),
    autoconocimiento: z.number().int().min(-20).max(20).optional(),
    conexion_social: z.number().int().min(-20).max(20).optional(),
    creatividad: z.number().int().min(-20).max(20).optional(),
  }).default({}),
});

export const completeMissionServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => MissionRewardSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Read current rows + objetos activos
    const [pRes, sRes, aRes, efRes, invRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_attributes").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("item_effects").select("*").eq("user_id", userId),
      supabase.from("inventory").select("*").eq("user_id", userId).eq("equipped", true),
    ]);
    if (!pRes.data || !sRes.data || !aRes.data) {
      throw new Error("Perfil no inicializado");
    }
    const prof = pRes.data;
    const stats = sRes.data;
    const attrs = aRes.data;

    // --- Efectos de objetos ---
    const activeRows = (efRes.data ?? []).filter((r) =>
      isEffectActive({
        uses_left: (r.uses_left as number | null) ?? null,
        expires_at: (r.expires_at as string | null) ?? null,
      }),
    );
    const equippedEffects: ItemEffect[] = (invRes.data ?? []).flatMap((r) => {
      const item = getItem((r.item_key as string | null) ?? "");
      return item && item.kind === "permanent" ? item.effects : [];
    });

    let xpMult = 1;
    let coinMult = 1;
    const attrBonus: Record<string, number> = {};
    let hasShield = false;
    for (const r of activeRows) {
      const mag = Number(r.magnitude);
      if (r.effect === "xp_multiplier") xpMult *= mag;
      else if (r.effect === "coin_multiplier") coinMult *= mag;
      else if (r.effect === "streak_shield") hasShield = true;
      else if (r.effect === "attribute_bonus") {
        const key = getItem(r.item_key as string)?.effects.find((e) => e.effect === "attribute_bonus")?.attribute;
        if (key) attrBonus[key] = (attrBonus[key] ?? 0) + mag;
      }
    }
    for (const e of equippedEffects) {
      if (e.effect === "xp_multiplier") xpMult *= e.magnitude;
      else if (e.effect === "coin_multiplier") coinMult *= e.magnitude;
      else if (e.effect === "attribute_bonus" && e.attribute) {
        attrBonus[e.attribute] = (attrBonus[e.attribute] ?? 0) + e.magnitude;
      }
    }

    const gainedXp = Math.round(data.xp * xpMult);
    const gainedCoins = Math.round(data.coins * coinMult);
    const boosted = xpMult > 1 || coinMult > 1 || Object.keys(attrBonus).length > 0;

    // XP / level
    let xp = prof.xp + gainedXp;
    let level = prof.level;
    let leveledUp = false;
    while (xp >= XP_PER_LEVEL) {
      xp -= XP_PER_LEVEL;
      level += 1;
      leveledUp = true;
    }

    // Streak (el Escudo Emocional evita perderla tras un día sin misiones)
    const today = new Date().toISOString().slice(0, 10);
    const last = prof.last_mission_date;
    let streak = prof.streak;
    let shieldUsed = false;
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (last === yesterday) streak = streak + 1;
      else if (hasShield && streak > 0) {
        streak = streak + 1;
        shieldUsed = true;
      } else streak = 1;
    }

    // Stats + attributes (con bonus de objetos)
    const newStats = {
      bienestar: clamp(stats.bienestar + (data.stats.bienestar ?? 0)),
      resiliencia: clamp(stats.resiliencia + (data.stats.resiliencia ?? 0)),
      energia: clamp(stats.energia + (data.stats.energia ?? 0)),
      claridad: clamp(stats.claridad + (data.stats.claridad ?? 0)),
    };
    const bonusFor = (k: string) => Math.round(attrBonus[k] ?? 0);
    const newAttrs = {
      resiliencia: clamp(attrs.resiliencia + (data.attributes.resiliencia ?? 0) + bonusFor("resiliencia")),
      empatia: clamp(attrs.empatia + (data.attributes.empatia ?? 0) + bonusFor("empatia")),
      mindfulness: clamp(attrs.mindfulness + (data.attributes.mindfulness ?? 0) + bonusFor("mindfulness")),
      autoconocimiento: clamp(attrs.autoconocimiento + (data.attributes.autoconocimiento ?? 0) + bonusFor("autoconocimiento")),
      conexion_social: clamp(attrs.conexion_social + (data.attributes.conexion_social ?? 0) + bonusFor("conexion_social")),
      creatividad: clamp(attrs.creatividad + (data.attributes.creatividad ?? 0) + bonusFor("creatividad")),
    };

    const [u1, u2, u3, u4] = await Promise.all([
      supabase.from("profiles").update({
        xp, level, streak, last_mission_date: today,
        coins: prof.coins + gainedCoins, gems: prof.gems + data.gems,
      }).eq("user_id", userId),
      supabase.from("user_stats").update(newStats).eq("user_id", userId),
      supabase.from("user_attributes").update(newAttrs).eq("user_id", userId),
      supabase.from("mission_completions").insert({
        user_id: userId,
        mission_id: data.missionId,
        title: data.title,
        xp_earned: gainedXp,
        is_ar: data.isAR,
        category: data.isAR ? "ar" : data.category,
        completed_date: today,
      }),
    ]);
    const err = u1.error ?? u2.error ?? u3.error ?? u4.error;
    if (err) throw new Error(err.message);

    // Consumir usos de los efectos por misión
    await consumeUses(
      supabase,
      activeRows.filter((r) => (r.uses_left as number | null) !== null && (shieldUsed || r.effect !== "streak_shield")),
    );

    // Telemetría del módulo de bienestar: solo se registra si el usuario dio
    // consentimiento de investigación. La gamificación (arriba) ya ocurrió y
    // no depende de esto.
    if (await hasActiveConsent(supabase, userId)) {
      // Evento de tarea + historia unificada: la actividad alimenta la serie
      // temporal que usa el módulo predictivo y el estado del Mundo.
      await supabase.from("task_events").insert({
        user_id: userId,
        mission_id: data.missionId,
        title: data.title,
        category: data.isAR ? "ar" : data.category,
        status: "completed",
        duration_seconds: data.durationSeconds,
        is_ar: data.isAR,
        occurred_date: today,
      });
      await addTimelineEvent(supabase, userId, {
        kind: "task_completed",
        title: `Tarea completada: ${data.title}`,
        detail: `+${gainedXp} XP · categoría ${data.isAR ? "ar" : data.category}${boosted ? " · con objeto activo" : ""}`,
        payload: { missionId: data.missionId, xp: gainedXp, isAR: data.isAR, boosted },
      });
      if (leveledUp) {
        await addTimelineEvent(supabase, userId, {
          kind: "milestone",
          title: `Subiste a nivel ${level}`,
          detail: "Hito de gamificación alcanzado",
          payload: { level },
        });
      }
    }

    // --- Logros ---
    const ctx = await buildAchievementContext(supabase, userId, { level, streak });
    const unlocked = await grantAchievements(supabase, userId, ctx);

    return {
      leveledUp,
      newLevel: level,
      unlockedAchievements: unlocked.map((u) => u.code),
      gainedXp,
      gainedCoins,
      boosted,
    };
  });

/** Descuenta un uso a los efectos consumibles y borra los agotados. */
async function consumeUses(
  supabase: SupabaseLike,
  rows: Array<{ id: string; uses_left: number | null }>,
) {
  for (const r of rows) {
    const left = (r.uses_left ?? 1) - 1;
    if (left <= 0) await supabase.from("item_effects").delete().eq("id", r.id);
    else await supabase.from("item_effects").update({ uses_left: left }).eq("id", r.id);
  }
}

/** Reúne el contexto real del usuario para evaluar los logros. */
export async function buildAchievementContext(
  supabase: SupabaseLike,
  userId: string,
  overrides: Partial<AchievementContext> = {},
): Promise<AchievementContext> {
  const today = new Date().toISOString().slice(0, 10);
  const [profRes, misRes, checkRes, predRes, worldRes, invRes] = await Promise.all([
    supabase.from("profiles").select("level,streak,daily_goal").eq("user_id", userId).maybeSingle(),
    supabase.from("mission_completions").select("category,is_ar,completed_date").eq("user_id", userId).limit(2000),
    supabase.from("wellbeing_checkins").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("wellbeing_predictions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("world_state").select("zones_unlocked").eq("user_id", userId).maybeSingle(),
    supabase.from("inventory").select("quantity").eq("user_id", userId),
  ]);

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
export async function grantAchievements(
  supabase: SupabaseLike,
  userId: string,
  ctx: AchievementContext,
) {
  const { data: ownedRows } = await supabase.from("achievements").select("code").eq("user_id", userId);
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
    return {
      user_id: userId,
      code: a.code,
      reward_xp: reward.xp,
      reward_coins: reward.coins,
      reward_gems: reward.gems,
    };
  });
  const { error } = await supabase.from("achievements").insert(rows);
  if (error) return [];

  const { data: prof } = await supabase
    .from("profiles").select("xp,level,coins,gems").eq("user_id", userId).maybeSingle();
  if (prof) {
    let xp = (prof.xp as number) + xpTotal;
    let level = prof.level as number;
    while (xp >= XP_PER_LEVEL) {
      xp -= XP_PER_LEVEL;
      level += 1;
    }
    await supabase
      .from("profiles")
      .update({
        xp,
        level,
        coins: (prof.coins as number) + coinTotal,
        gems: (prof.gems as number) + gemTotal,
      })
      .eq("user_id", userId);
  }
  return pending;
}

const BuySchema = z.object({
  itemName: z.string().min(1).max(80),
  price: z.number().int().min(0).max(1000),
  currency: z.enum(["coins", "gems"]),
});

export const buyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => BuySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const item = getItemByName(data.itemName);
    if (!item) throw new Error("Objeto no disponible");
    if (item.price !== data.price || item.currency !== data.currency) {
      throw new Error("Precio inválido");
    }

    const { data: prof, error: pErr } = await supabase
      .from("profiles").select("coins,gems").eq("user_id", userId).single();
    if (pErr || !prof) throw new Error("Perfil no encontrado");

    const balance = data.currency === "coins" ? prof.coins : prof.gems;
    if (balance < item.price) throw new Error("Saldo insuficiente");

    const { data: existing } = await supabase
      .from("inventory")
      .select("id,quantity")
      .eq("user_id", userId)
      .eq("item_name", item.name)
      .maybeSingle();

    if (existing) {
      if (item.kind === "permanent") throw new Error("Ya tienes este objeto");
      const { error } = await supabase
        .from("inventory")
        .update({ quantity: ((existing.quantity as number | null) ?? 1) + 1, item_key: item.key, kind: item.kind })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("inventory").insert({
        user_id: userId,
        item_name: item.name,
        item_key: item.key,
        kind: item.kind,
        quantity: 1,
      });
      if (error) throw new Error(error.message);
    }

    const update = item.currency === "coins"
      ? { coins: prof.coins - item.price }
      : { gems: prof.gems - item.price };
    const { error: upErr } = await supabase.from("profiles").update(update).eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);

    const ctx = await buildAchievementContext(supabase, userId);
    const unlocked = await grantAchievements(supabase, userId, ctx);
    return { ok: true, unlockedAchievements: unlocked.map((a) => a.code) };
  });

/** Usa un consumible: crea sus efectos activos y descuenta una unidad. */
export const useItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ itemKey: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const item = getItem(data.itemKey);
    if (!item || item.kind !== "consumable") throw new Error("Objeto no usable");

    const { data: row } = await supabase
      .from("inventory")
      .select("id,quantity")
      .eq("user_id", userId)
      .eq("item_name", item.name)
      .maybeSingle();
    const qty = (row?.quantity as number | null) ?? 0;
    if (!row || qty < 1) throw new Error("No tienes este objeto");

    const now = Date.now();
    const rows = item.effects.map((e) => ({
      user_id: userId,
      item_key: item.key,
      effect: e.effect,
      magnitude: e.magnitude,
      uses_left: e.uses ?? null,
      expires_at: e.hours ? new Date(now + e.hours * 3_600_000).toISOString() : null,
    }));
    const { error } = await supabase.from("item_effects").insert(rows);
    if (error) throw new Error(error.message);

    if (qty <= 1) await supabase.from("inventory").delete().eq("id", row.id);
    else await supabase.from("inventory").update({ quantity: qty - 1 }).eq("id", row.id);

    if (await hasActiveConsent(supabase, userId)) {
      await addTimelineEvent(supabase, userId, {
        kind: "milestone",
        title: `Usaste ${item.name}`,
        detail: item.detail,
        payload: { itemKey: item.key },
      });
    }

    const ctx = await buildAchievementContext(supabase, userId, { itemsUsed: 1 });
    const unlocked = await grantAchievements(supabase, userId, ctx);
    return { ok: true, unlockedAchievements: unlocked.map((a) => a.code) };
  });

/** Equipa o desequipa un objeto permanente (máx. MAX_EQUIPPED a la vez). */
export const toggleEquip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ itemKey: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const item = getItem(data.itemKey);
    if (!item || item.kind !== "permanent") throw new Error("Objeto no equipable");

    const { data: rows } = await supabase
      .from("inventory")
      .select("id,item_name,equipped")
      .eq("user_id", userId);
    const target = (rows ?? []).find((r) => r.item_name === item.name);
    if (!target) throw new Error("No tienes este objeto");

    const equippedCount = (rows ?? []).filter((r) => r.equipped).length;
    const next = !target.equipped;
    if (next && equippedCount >= MAX_EQUIPPED) {
      throw new Error(`Solo puedes equipar ${MAX_EQUIPPED} objetos a la vez`);
    }
    const { error } = await supabase
      .from("inventory")
      .update({ equipped: next, item_key: item.key, kind: item.kind })
      .eq("id", target.id);
    if (error) throw new Error(error.message);
    return { ok: true, equipped: next };
  });

/** Resumen real para la pantalla de perfil: trofeos, categorías y logros. */
export const getProfileSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const ctx = await buildAchievementContext(supabase, userId);
    const today = new Date().toISOString().slice(0, 10);
    const since30 = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const since7 = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const since14 = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);

    const { data: recent } = await supabase
      .from("mission_completions")
      .select("category,is_ar,completed_date,xp_earned")
      .eq("user_id", userId)
      .gte("completed_date", since30)
      .limit(2000);

    const rows = recent ?? [];
    const cat30: Record<string, number> = {};
    const cat7: Record<string, number> = {};
    const catPrev7: Record<string, number> = {};
    let xp30 = 0;
    for (const r of rows) {
      const c = (r.category as string | null) ?? "autocuidado";
      const d = (r.completed_date as string | null) ?? today;
      cat30[c] = (cat30[c] ?? 0) + 1;
      xp30 += (r.xp_earned as number | null) ?? 0;
      if (d >= since7) cat7[c] = (cat7[c] ?? 0) + 1;
      else if (d >= since14) catPrev7[c] = (catPrev7[c] ?? 0) + 1;
    }

    const activeDays = new Set(rows.map((r) => r.completed_date as string)).size;

    return {
      context: ctx,
      trophies: {
        level: ctx.level,
        streak: ctx.streak,
        missions: ctx.missions,
        missionsAR: ctx.missionsAR,
        checkins: ctx.checkins,
        zonesUnlocked: ctx.zonesUnlocked,
        activeDays30: activeDays,
        xp30,
      },
      categories30: cat30,
      categories7: cat7,
      categoriesPrev7: catPrev7,
    };
  });


const MigrateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  avatar: z.number().int().min(0).max(20).optional(),
  archetype: z.number().int().min(0).max(10).nullable().optional(),
  level: z.number().int().min(1).max(99).optional(),
  xp: z.number().int().min(0).max(10000).optional(),
  coins: z.number().int().min(0).max(100000).optional(),
  gems: z.number().int().min(0).max(10000).optional(),
  streak: z.number().int().min(0).max(999).optional(),
  stats: z.record(z.string(), z.number().int().min(0).max(100)).optional(),
  attributes: z.record(z.string(), z.number().int().min(0).max(100)).optional(),
  inventory: z.array(z.string().min(1).max(80)).max(100).optional(),
});

export const migrateLocalProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => MigrateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const profUpdate: {
      name?: string; avatar?: number; archetype?: number | null;
      level?: number; xp?: number; coins?: number; gems?: number; streak?: number;
    } = {};
    if (data.name !== undefined) profUpdate.name = data.name;
    if (data.avatar !== undefined) profUpdate.avatar = data.avatar;
    if (data.archetype !== undefined) profUpdate.archetype = data.archetype;
    if (data.level !== undefined) profUpdate.level = data.level;
    if (data.xp !== undefined) profUpdate.xp = data.xp;
    if (data.coins !== undefined) profUpdate.coins = data.coins;
    if (data.gems !== undefined) profUpdate.gems = data.gems;
    if (data.streak !== undefined) profUpdate.streak = data.streak;
    if (Object.keys(profUpdate).length) {
      await supabase.from("profiles").update(profUpdate).eq("user_id", userId);
    }
    if (data.stats) {
      const s = data.stats;
      await supabase.from("user_stats").update({
        bienestar: s.bienestar, resiliencia: s.resiliencia,
        energia: s.energia, claridad: s.claridad,
      }).eq("user_id", userId);
    }
    if (data.attributes) {
      const a = data.attributes;
      await supabase.from("user_attributes").update({
        resiliencia: a.resiliencia, empatia: a.empatia, mindfulness: a.mindfulness,
        autoconocimiento: a.autoconocimiento,
        conexion_social: a.conexionSocial ?? a.conexion_social,
        creatividad: a.creatividad,
      }).eq("user_id", userId);
    }
    if (data.inventory?.length) {
      await supabase.from("inventory").upsert(
        data.inventory.map((item_name) => ({ user_id: userId, item_name })),
        { onConflict: "user_id,item_name" }
      );
    }
    return { ok: true };
  });

const SettingsSchema = z.object({
  theme: z.enum(["dark", "light"]).optional(),
  textSize: z.enum(["normal", "large", "xl"]).optional(),
  dailyGoal: z.number().int().min(1).max(20).optional(),
  onboarded: z.boolean().optional(),
});

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SettingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const update: {
      theme?: string;
      text_size?: string;
      daily_goal?: number;
      onboarded?: boolean;
    } = {};
    if (data.theme !== undefined) update.theme = data.theme;
    if (data.textSize !== undefined) update.text_size = data.textSize;
    if (data.dailyGoal !== undefined) update.daily_goal = data.dailyGoal;
    if (data.onboarded !== undefined) update.onboarded = data.onboarded;
    if (Object.keys(update).length === 0) return { ok: true };
    const { error } = await supabase.from("profiles").update(update).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getWeeklyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("mission_completions")
      .select("completed_date, xp_earned, is_ar")
      .eq("user_id", userId)
      .gte("completed_date", since);
    if (error) throw new Error(error.message);
    const buckets: Record<string, { xp: number; count: number; ar: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
      buckets[d] = { xp: 0, count: 0, ar: 0 };
    }
    for (const row of data ?? []) {
      const b = buckets[row.completed_date];
      if (!b) continue;
      b.xp += row.xp_earned;
      b.count += 1;
      if (row.is_ar) b.ar += 1;
    }
    return Object.entries(buckets).map(([date, v]) => ({ date, ...v }));
  });
