/**
 * Server functions del contexto Bienestar — capa de Servicio.
 * Responsabilidad única: autenticar, validar entrada (zod), componer
 * dependencias y delegar en los casos de uso de Aplicación.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recordTaskEvent, registerCheckin, updateConsent } from "@/application/wellbeing/useCases";
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
    z.object({ accepted: z.boolean(), wearablesOptIn: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<WellbeingPayload> =>
    updateConsent(buildWellbeingDeps(context.supabase), context.userId, data.accepted, data.wearablesOptIn ?? false),
  );

/** Escalas del check-in: enteros 1–5; sueño 0–24 h. */
const CheckinSchema = z.object({
  mood: z.number().int().min(1).max(5),
  stress: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  social: z.number().int().min(1).max(5),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
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
