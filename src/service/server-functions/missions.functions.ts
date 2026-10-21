/**
 * Server function "Completar misión" — capa de Servicio.
 * Valida la recompensa, carga el estado, delega el cálculo al caso de uso
 * y persiste el resultado (gamificación + telemetría de bienestar + logros).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addTimelineEvent, hasActiveConsent } from "@/infrastructure/persistence/supabase/wellbeingRepository";
import { consumeUses, evaluateAndGrant } from "@/infrastructure/persistence/supabase/gamificationRepository";
import { planMissionCompletion } from "@/application/gamification/completeMission";
import { isEffectActive } from "@/domain/gamification/progression";

/** Delta permitido por misión en cada estadística/atributo. */
const delta = z.number().int().min(-20).max(20).optional();

const MissionRewardSchema = z.object({
  missionId: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  isAR: z.boolean().default(false),
  xp: z.number().int().min(0).max(500).default(0),
  coins: z.number().int().min(0).max(500).default(0),
  gems: z.number().int().min(0).max(20).default(0),
  stats: z.object({ bienestar: delta, resiliencia: delta, energia: delta, claridad: delta }).default({}),
  category: z.enum(["autocuidado", "reflexion", "movimiento", "social", "cognitivo", "ar"]).default("autocuidado"),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
  attributes: z
    .object({ resiliencia: delta, empatia: delta, mindfulness: delta, autoconocimiento: delta, conexion_social: delta, creatividad: delta })
    .default({}),
});

export const completeMissionServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => MissionRewardSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Cargar estado actual y objetos activos/equipados.
    const [pRes, sRes, aRes, efRes, invRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_attributes").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("item_effects").select("*").eq("user_id", userId),
      supabase.from("inventory").select("*").eq("user_id", userId).eq("equipped", true),
    ]);
    if (!pRes.data || !sRes.data || !aRes.data) throw new Error("Perfil no inicializado");
    const p = pRes.data, s = sRes.data, a = aRes.data;

    const effects = (efRes.data ?? [])
      .map((r) => ({
        id: r.id as string,
        item_key: r.item_key as string,
        effect: r.effect as string,
        magnitude: Number(r.magnitude),
        uses_left: (r.uses_left as number | null) ?? null,
        expires_at: (r.expires_at as string | null) ?? null,
      }))
      .filter((e) => isEffectActive(e));
    const equippedKeys = (invRes.data ?? []).map((r) => (r.item_key as string | null) ?? "");

    // 2. Caso de uso: cálculo puro del resultado.
    const plan = planMissionCompletion(
      {
        xp: p.xp, level: p.level, coins: p.coins, gems: p.gems, streak: p.streak, lastMissionDate: p.last_mission_date,
        stats: { bienestar: s.bienestar, resiliencia: s.resiliencia, energia: s.energia, claridad: s.claridad },
        attributes: {
          resiliencia: a.resiliencia, empatia: a.empatia, mindfulness: a.mindfulness,
          autoconocimiento: a.autoconocimiento, conexion_social: a.conexion_social, creatividad: a.creatividad,
        },
      },
      { xp: data.xp, coins: data.coins, gems: data.gems, stats: data.stats, attributes: data.attributes },
      effects,
      equippedKeys,
    );
    const category = data.isAR ? "ar" : data.category;

    // 3. Persistir gamificación.
    const results = await Promise.all([
      supabase.from("profiles").update(plan.profile).eq("user_id", userId),
      supabase.from("user_stats").update(plan.stats).eq("user_id", userId),
      supabase.from("user_attributes").update(plan.attributes).eq("user_id", userId),
      supabase.from("mission_completions").insert({
        user_id: userId, mission_id: data.missionId, title: data.title, xp_earned: plan.gainedXp,
        is_ar: data.isAR, category, completed_date: plan.today,
      }),
    ]);
    const err = results.find((r) => r.error)?.error;
    if (err) throw new Error(err.message);
    await consumeUses(supabase, plan.effectsToConsume);

    // 4. Telemetría de bienestar: solo con consentimiento de investigación.
    if (await hasActiveConsent(supabase, userId)) {
      await supabase.from("task_events").insert({
        user_id: userId, mission_id: data.missionId, title: data.title, category, status: "completed",
        duration_seconds: data.durationSeconds, is_ar: data.isAR, occurred_date: plan.today,
      });
      await addTimelineEvent(supabase, userId, {
        kind: "task_completed",
        title: `Tarea completada: ${data.title}`,
        detail: `+${plan.gainedXp} XP · categoría ${category}${plan.boosted ? " · con objeto activo" : ""}`,
        payload: { missionId: data.missionId, xp: plan.gainedXp, isAR: data.isAR, boosted: plan.boosted },
      });
      if (plan.leveledUp) {
        await addTimelineEvent(supabase, userId, {
          kind: "milestone", title: `Subiste a nivel ${plan.profile.level}`,
          detail: "Hito de gamificación alcanzado", payload: { level: plan.profile.level },
        });
      }
    }

    // 5. Logros.
    const unlocked = await evaluateAndGrant(supabase, userId, { level: plan.profile.level, streak: plan.profile.streak });
    return {
      leveledUp: plan.leveledUp,
      newLevel: plan.profile.level,
      unlockedAchievements: unlocked,
      gainedXp: plan.gainedXp,
      gainedCoins: plan.gainedCoins,
      boosted: plan.boosted,
    };
  });
