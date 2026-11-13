/**
 * Server functions del contexto Bienestar — capa de Servicio.
 * Responsabilidad única: autenticar, validar entrada (zod), componer
 * dependencias y delegar en los casos de uso de Aplicación.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recordTaskEvent, recordWho5, registerCheckin, updateConsent, updateWritingShare } from "@/application/wellbeing/useCases";
import { evaluateAndGrant } from "@/infrastructure/persistence/supabase/gamificationRepository";
import { buildWellbeingDeps } from "@/infrastructure/persistence/supabase/wellbeingAdapters";
import type { WellbeingPayload } from "@/infrastructure/persistence/supabase/wellbeingRepository";

export type { WellbeingPayload, ConsentState, TimelineEntry } from "@/infrastructure/persistence/supabase/wellbeingRepository";

/** Estado completo del módulo (consentimiento, check-ins, predicción, Mundo, timeline). */
export const getWellbeing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WellbeingPayload> =>
    buildWellbeingDeps(context.supabase).reader.load(context.userId),
  );

/** Acepta o revoca el consentimiento informado. */
export const setResearchConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ accepted: z.boolean(), wearablesOptIn: z.boolean().optional(), shareWriting: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<WellbeingPayload> =>
    updateConsent(buildWellbeingDeps(context.supabase), context.userId, data.accepted, data.wearablesOptIn ?? false, data.shareWriting ?? false),
  );

/** Autoriza o retira que el equipo de psicología lea lo que escribe en sus misiones. */
export const setWritingShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ share: z.boolean() }).parse(d))
  .handler(async ({ data, context }): Promise<WellbeingPayload> =>
    updateWritingShare(buildWellbeingDeps(context.supabase), context.userId, data.share),
  );

/** Escalas del check-in: enteros 1–5; sueño 0–24 h. */
const CheckinSchema = z.object({
  mood: z.number().int().min(1).max(5),
  stress: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  social: z.number().int().min(1).max(5),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  localHour: z.number().int().min(0).max(23).nullable().optional(),
  responseSeconds: z.number().int().min(0).max(3600).nullable().optional(),
});

/** Guarda el check-in diario (requiere consentimiento). */
export const saveCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CheckinSchema.parse(d))
  .handler(async ({ data, context }): Promise<WellbeingPayload> =>
    registerCheckin(buildWellbeingDeps(context.supabase), context.userId, data),
  );

/** Evento de tarea: une gamificación → serie temporal → predicción → Mundo → Timeline. */
const TaskEventSchema = z.object({
  missionId: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  status: z.enum(["assigned", "started", "completed", "skipped"]),
  category: z.enum(["autocuidado", "reflexion", "movimiento", "social", "cognitivo", "ar"]).default("autocuidado"),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
  isAR: z.boolean().default(false),
});

export const logTaskEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TaskEventSchema.parse(d))
  .handler(async ({ data, context }): Promise<WellbeingPayload> =>
    recordTaskEvent(buildWellbeingDeps(context.supabase), context.userId, data),
  );

/** Pergamino del bienestar: las 5 respuestas de la WHO-5 (0–5 cada una), cada 14 días. */
export const submitWho5 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ answers: z.array(z.number().int().min(0).max(5)).length(5) }).parse(d))
  .handler(async ({ data, context }): Promise<WellbeingPayload & { unlockedAchievements: string[] }> => {
    const payload = await recordWho5(buildWellbeingDeps(context.supabase), context.userId, data.answers);
    const unlockedAchievements = await evaluateAndGrant(context.supabase, context.userId);
    return { ...payload, unlockedAchievements };
  });
