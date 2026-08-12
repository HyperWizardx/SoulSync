import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONSENT_VERSION } from "@/lib/wellbeing/types";
import { addTimelineEvent, assertConsent, loadWellbeing, todayISO } from "@/lib/wellbeing/load";
import type { WellbeingPayload } from "@/lib/wellbeing/load";

export type { WellbeingPayload, ConsentState, TimelineEntry } from "@/lib/wellbeing/load";

export const getWellbeing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WellbeingPayload> =>
    loadWellbeing(context.supabase, context.userId),
  );

export const setResearchConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ accepted: z.boolean(), wearablesOptIn: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<WellbeingPayload> => {
    const { supabase, userId } = context;
    if (data.accepted) {
      await supabase.from("research_consent").insert({
        user_id: userId,
        consent_version: CONSENT_VERSION,
        wearables_opt_in: data.wearablesOptIn ?? false,
      });
    } else {
      await supabase
        .from("research_consent")
        .update({ revoked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("revoked_at", null);
      // Minimización de datos: al revocar se elimina lo recogido por el módulo.
      await supabase.from("wellbeing_predictions").delete().eq("user_id", userId);
      await supabase.from("wellbeing_checkins").delete().eq("user_id", userId);
      await supabase.from("wellbeing_scales").delete().eq("user_id", userId);
      await supabase.from("timeline_events").delete().eq("user_id", userId);
      await supabase.from("task_events").delete().eq("user_id", userId);
    }
    return loadWellbeing(supabase, userId);
  });

export const saveCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        mood: z.number().int().min(1).max(5),
        stress: z.number().int().min(1).max(5),
        energy: z.number().int().min(1).max(5),
        social: z.number().int().min(1).max(5),
        sleepHours: z.number().min(0).max(24).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<WellbeingPayload> => {
    const { supabase, userId } = context;
    await assertConsent(supabase, userId);

    await supabase.from("wellbeing_checkins").upsert(
      {
        user_id: userId,
        checkin_date: todayISO(),
        mood: data.mood,
        stress: data.stress,
        energy: data.energy,
        social: data.social,
        sleep_hours: data.sleepHours ?? null,
      },
      { onConflict: "user_id,checkin_date" },
    );

    // El check-in forma parte de la serie temporal e historia unificada.
    await addTimelineEvent(supabase, userId, {
      kind: "checkin",
      title: "Check-in diario registrado",
      detail: `Ánimo ${data.mood}/5 · Estrés ${data.stress}/5 · Energía ${data.energy}/5`,
      payload: {
        mood: data.mood,
        stress: data.stress,
        energy: data.energy,
        social: data.social,
      },
    });

    return loadWellbeing(supabase, userId);
  });

const TaskEventSchema = z.object({
  missionId: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  status: z.enum(["assigned", "started", "completed", "skipped"]),
  category: z
    .enum(["autocuidado", "reflexion", "movimiento", "social", "cognitivo", "ar"])
    .default("autocuidado"),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
  isAR: z.boolean().default(false),
});

/**
 * Registra un evento del ciclo de vida de una tarea diaria. Es la fuente que
 * conecta gamificación → serie temporal → predicción → Mundo → Timeline.
 */
export const logTaskEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TaskEventSchema.parse(d))
  .handler(async ({ data, context }): Promise<WellbeingPayload> => {
    const { supabase, userId } = context;

    await supabase.from("task_events").insert({
      user_id: userId,
      mission_id: data.missionId,
      title: data.title,
      category: data.category,
      status: data.status,
      duration_seconds: data.durationSeconds,
      is_ar: data.isAR,
      occurred_date: todayISO(),
    });

    if (data.status === "skipped") {
      await addTimelineEvent(supabase, userId, {
        kind: "task_skipped",
        title: `Tarea omitida: ${data.title}`,
        detail: `Categoría: ${data.category}`,
        payload: { missionId: data.missionId, category: data.category },
      });
    }

    return loadWellbeing(supabase, userId);
  });
