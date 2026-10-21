/**
 * Server functions de Progreso y Perfil — capa de Servicio.
 * Lectura del estado del jugador, edición de perfil/ajustes, resumen del perfil,
 * estadísticas semanales y migración del progreso local.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAchievementContext } from "@/infrastructure/persistence/supabase/gamificationRepository";
import { isEffectActive } from "@/domain/gamification/progression";

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


/** Estado completo del jugador (crea filas faltantes si el registro inicial falló). */
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
