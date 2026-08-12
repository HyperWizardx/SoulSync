import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addTimelineEvent } from "@/lib/wellbeing/load";

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
  achievements: string[];
};

export const getProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProgressPayload> => {
    const { supabase, userId } = context;
    const [pRes, sRes, aRes, hRes, iRes, achRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_attributes").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("mission_completions")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(50),
      supabase.from("inventory").select("item_name").eq("user_id", userId),
      supabase.from("achievements").select("code").eq("user_id", userId),
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

    // Read current rows
    const [pRes, sRes, aRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_attributes").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    if (!pRes.data || !sRes.data || !aRes.data) {
      throw new Error("Perfil no inicializado");
    }
    const prof = pRes.data;
    const stats = sRes.data;
    const attrs = aRes.data;

    // XP / level
    let xp = prof.xp + data.xp;
    let level = prof.level;
    let leveledUp = false;
    while (xp >= XP_PER_LEVEL) {
      xp -= XP_PER_LEVEL;
      level += 1;
      leveledUp = true;
    }

    // Streak
    const today = new Date().toISOString().slice(0, 10);
    const last = prof.last_mission_date;
    let streak = prof.streak;
    if (last === today) {
      // same day, keep
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = last === yesterday ? streak + 1 : 1;
    }

    // Stats + attributes
    const newStats = {
      bienestar: clamp(stats.bienestar + (data.stats.bienestar ?? 0)),
      resiliencia: clamp(stats.resiliencia + (data.stats.resiliencia ?? 0)),
      energia: clamp(stats.energia + (data.stats.energia ?? 0)),
      claridad: clamp(stats.claridad + (data.stats.claridad ?? 0)),
    };
    const newAttrs = {
      resiliencia: clamp(attrs.resiliencia + (data.attributes.resiliencia ?? 0)),
      empatia: clamp(attrs.empatia + (data.attributes.empatia ?? 0)),
      mindfulness: clamp(attrs.mindfulness + (data.attributes.mindfulness ?? 0)),
      autoconocimiento: clamp(attrs.autoconocimiento + (data.attributes.autoconocimiento ?? 0)),
      conexion_social: clamp(attrs.conexion_social + (data.attributes.conexion_social ?? 0)),
      creatividad: clamp(attrs.creatividad + (data.attributes.creatividad ?? 0)),
    };

    const [u1, u2, u3, u4] = await Promise.all([
      supabase.from("profiles").update({
        xp, level, streak, last_mission_date: today,
        coins: prof.coins + data.coins, gems: prof.gems + data.gems,
      }).eq("user_id", userId),
      supabase.from("user_stats").update(newStats).eq("user_id", userId),
      supabase.from("user_attributes").update(newAttrs).eq("user_id", userId),
      supabase.from("mission_completions").insert({
        user_id: userId,
        mission_id: data.missionId,
        title: data.title,
        xp_earned: data.xp,
        is_ar: data.isAR,
        completed_date: today,
      }),
    ]);
    const err = u1.error ?? u2.error ?? u3.error ?? u4.error;
    if (err) throw new Error(err.message);

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
      detail: `+${data.xp} XP · categoría ${data.isAR ? "ar" : data.category}`,
      payload: { missionId: data.missionId, xp: data.xp, isAR: data.isAR },
    });
    if (leveledUp) {
      await addTimelineEvent(supabase, userId, {
        kind: "milestone",
        title: `Subiste a nivel ${level}`,
        detail: "Hito de gamificación alcanzado",
        payload: { level },
      });
    }

    // --- Logros ---
    const dailyGoal = (prof as { daily_goal?: number }).daily_goal ?? 3;
    const [missionCountRes, arCountRes, todayCountRes, alreadyRes] = await Promise.all([
      supabase.from("mission_completions").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("mission_completions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_ar", true),
      supabase.from("mission_completions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("completed_date", today),
      supabase.from("achievements").select("code").eq("user_id", userId),
    ]);
    const totalMissions = missionCountRes.count ?? 0;
    const arMissions = arCountRes.count ?? 0;
    const todayMissions = todayCountRes.count ?? 0;
    const owned = new Set((alreadyRes.data ?? []).map((r) => r.code));

    const candidates: string[] = [];
    if (totalMissions >= 1) candidates.push("first_step");
    if (streak >= 3) candidates.push("streak_3");
    if (streak >= 7) candidates.push("streak_7");
    if (streak >= 30) candidates.push("streak_30");
    if (totalMissions >= 10) candidates.push("missions_10");
    if (totalMissions >= 50) candidates.push("missions_50");
    if (data.isAR && arMissions >= 1) candidates.push("ar_first");
    if (arMissions >= 5) candidates.push("ar_5");
    if (level >= 5) candidates.push("level_5");
    if (level >= 10) candidates.push("level_10");
    if (todayMissions >= dailyGoal) candidates.push("daily_goal");

    const toUnlock = candidates.filter((c) => !owned.has(c));
    if (toUnlock.length > 0) {
      await supabase.from("achievements").insert(
        toUnlock.map((code) => ({ user_id: userId, code }))
      );
    }

    return { leveledUp, newLevel: level, unlockedAchievements: toUnlock };
  });

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
    const { data: prof, error: pErr } = await supabase
      .from("profiles").select("coins,gems").eq("user_id", userId).single();
    if (pErr || !prof) throw new Error("Perfil no encontrado");

    const balance = data.currency === "coins" ? prof.coins : prof.gems;
    if (balance < data.price) throw new Error("Saldo insuficiente");

    const { error: invErr } = await supabase
      .from("inventory")
      .insert({ user_id: userId, item_name: data.itemName });
    if (invErr) {
      if (invErr.code === "23505") throw new Error("Ya tienes este objeto");
      throw new Error(invErr.message);
    }

    const update = data.currency === "coins"
      ? { coins: prof.coins - data.price }
      : { gems: prof.gems - data.price };
    const { error: upErr } = await supabase.from("profiles").update(update).eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);

    return { ok: true };
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
